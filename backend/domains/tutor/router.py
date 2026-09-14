import time
import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.models.tutor import Conversation, Message
from backend.models.concept import Concept
from backend.models.activity import ActivityEvent
from backend.models.ai_observability import AIRequest
from backend.schemas.tutor import ChatMessageResponse, CitationResponse, SendMessageInput
from backend.domains.auth.dependencies import get_current_user, verify_project_access
from backend.ai.providers import get_llm_provider, get_embedding_provider
from backend.ai.vector_store import vector_store
from backend.ai.prompts import TUTOR_SYSTEM_PROMPT_V1

router = APIRouter(prefix="/projects/{project_id}/tutor", tags=["tutor"])

def format_message(msg: Message) -> ChatMessageResponse:
    citations_data = None
    if msg.citations:
        citations_data = [
            CitationResponse(
                id=c.get("id", f"ct_{i}"),
                materialId=c.get("materialId", ""),
                materialName=c.get("materialName", ""),
                page=c.get("page", 1),
            )
            for i, c in enumerate(msg.citations)
        ]
    return ChatMessageResponse(
        id=msg.id,
        conversationId=msg.conversation_id,
        role=msg.role,
        content=msg.content,
        citations=citations_data,
        unsupported=msg.unsupported,
        suggestedFollowUps=msg.suggested_followups or [],
        createdAt=msg.created_at.isoformat() if msg.created_at else "",
    )

@router.get("/conversation", response_model=List[ChatMessageResponse])
async def get_conversation(
    project: Project = Depends(verify_project_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find active conversation
    res = await db.execute(
        select(Conversation)
        .where(Conversation.project_id == project.id, Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    )
    conv = res.scalars().first()
    if not conv:
        return []

    msg_res = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())
    )
    messages = msg_res.scalars().all()
    return [format_message(m) for m in messages]

@router.post("/messages", response_model=List[ChatMessageResponse])
async def send_message(
    input_data: SendMessageInput,
    project: Project = Depends(verify_project_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get or create conversation
    conv_res = await db.execute(
        select(Conversation)
        .where(Conversation.project_id == project.id, Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
    )
    conv = conv_res.scalars().first()
    if not conv:
        conv = Conversation(
            id=f"cv_{uuid.uuid4().hex[:10]}",
            project_id=project.id,
            user_id=current_user.id,
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

    # 1. Store User Message
    user_msg = Message(
        id=f"m_{uuid.uuid4().hex[:12]}",
        conversation_id=conv.id,
        project_id=project.id,
        role="user",
        content=input_data.content,
        citations=[],
        unsupported=False,
        suggested_followups=[],
    )
    db.add(user_msg)
    await db.commit()

    # 2. Retrieve Project Evidence
    start_time = time.time()
    embedding_provider = get_embedding_provider()
    query_vec = embedding_provider.embed_text(input_data.content)
    
    # HARD PROJECT ISOLATION: search is strictly scoped to project.id
    retrieved_chunks = vector_store.search(
        project_id=project.id,
        query_embedding=query_vec,
        query_text=input_data.content,
        top_k=4,
    )
    retrieval_latency = int((time.time() - start_time) * 1000)

    # Relevance check: minimum threshold of 0.12 to consider grounded
    is_unsupported = False
    if not retrieved_chunks or max(c.similarity_score for c in retrieved_chunks) < 0.12:
        is_unsupported = True

    # 3. Call LLM
    llm = get_llm_provider()
    
    if is_unsupported:
        user_prompt = f"Question: {input_data.content}\nStatus: UNSUPPORTED_QUERY_TRIGGERED"
        citations_list = []
        follow_ups = [
            f"Explain {project.name} fundamentals",
            "What topics are covered in my uploaded materials?",
            "Start an adaptive quiz instead",
        ]
        llm_resp = await llm.generate(TUTOR_SYSTEM_PROMPT_V1, user_prompt)
        assistant_content = (
            f"I couldn't find enough evidence in this project's learning materials to answer that reliably. "
            f"Your uploaded materials cover concepts for \"{project.name}\", but do not contain sufficient documentation for this query. "
            f"Uploading additional lecture notes, papers, or documentation covering this specific topic will allow me to answer with verified citations."
        )
    else:
        # Assemble grounded context
        context_blocks = []
        citations_list = []
        for i, chunk in enumerate(retrieved_chunks):
            context_blocks.append(
                f"[Source: {chunk.material_name}, Page {chunk.page_number}]: {chunk.content}"
            )
            citations_list.append({
                "id": f"ct_{uuid.uuid4().hex[:8]}",
                "materialId": chunk.material_id,
                "materialName": chunk.material_name,
                "page": chunk.page_number,
            })

        evidence_text = "\n\n".join(context_blocks)
        user_prompt = (
            f"Project: {project.name}\n"
            f"Learning Goal: {project.learning_goal}\n\n"
            f"[Retrieved Project Evidence]:\n{evidence_text}\n\n"
            f"Learner Question: {input_data.content}"
        )
        llm_resp = await llm.generate(TUTOR_SYSTEM_PROMPT_V1, user_prompt)
        assistant_content = llm_resp.content

        # Derive suggested followups based on concepts
        c_res = await db.execute(select(Concept.name).where(Concept.project_id == project.id).limit(3))
        concept_names = c_res.scalars().all()
        follow_ups = [f"How does this relate to {cn}?" for cn in concept_names] if concept_names else ["Give an example", "Test my understanding with a quiz"]

    # 4. Save Assistant Message
    assistant_msg = Message(
        id=f"m_{uuid.uuid4().hex[:12]}",
        conversation_id=conv.id,
        project_id=project.id,
        role="assistant",
        content=assistant_content,
        citations=citations_list,
        unsupported=is_unsupported,
        suggested_followups=follow_ups,
    )
    db.add(assistant_msg)

    # 5. Log AI Observability
    ai_log = AIRequest(
        id=f"ai_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=project.id,
        feature="tutor",
        model=llm_resp.model,
        latency_ms=llm_resp.latency_ms + retrieval_latency,
        input_tokens=llm_resp.input_tokens,
        output_tokens=llm_resp.output_tokens,
        cost_usd=round((llm_resp.input_tokens * 0.00000015) + (llm_resp.output_tokens * 0.0000006), 6),
        status="success",
        retrieval_latency_ms=retrieval_latency,
        source_chunk_ids=[c.id for c in retrieved_chunks],
        prompt_version="tutor_v1",
    )
    db.add(ai_log)

    # 6. Log Activity
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=project.id,
        project_name=project.name,
        event_type="TUTOR_QUESTION_ASKED",
        summary=f'Asked Tutor: "{input_data.content[:60]}..."',
        metadata_json={"unsupported": is_unsupported, "citations_count": len(citations_list)},
    )
    db.add(event)

    # Update project last activity
    project.last_activity_at = datetime.now(timezone.utc)

    await db.commit()

    # Return full conversation
    msg_res = await db.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.asc())
    )
    messages = msg_res.scalars().all()
    return [format_message(m) for m in messages]
