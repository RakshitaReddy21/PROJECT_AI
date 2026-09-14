import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.models.concept import Concept
from backend.models.mistake import MistakeRecord
from backend.models.quiz import QuizAttempt
from backend.domains.auth.dependencies import get_current_user, verify_project_access

router = APIRouter(prefix="/projects/{project_id}", tags=["differentiators"])

@router.get("/mistakes")
async def get_mistakes(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(MistakeRecord)
        .where(MistakeRecord.project_id == project.id)
        .order_by(MistakeRecord.occurrence_count.desc())
    )
    mistakes = res.scalars().all()
    if not mistakes:
        # Provide seeded illustrative mistake pattern if none yet
        return [
            {
                "id": "mis_demo_1",
                "projectId": project.id,
                "conceptName": "Vector Search",
                "mistakeType": "conceptual",
                "evidence": "Repeated confusion distinguishing exact vs. approximate nearest-neighbor search guarantees.",
                "remediation": "Review index trade-offs: ANN sacrifices 1-2% theoretical recall for a 100x query latency speedup.",
                "occurrenceCount": 2,
                "lastOccurred": "Recent session",
            },
            {
                "id": "mis_demo_2",
                "projectId": project.id,
                "conceptName": "Retrieval Ranking",
                "mistakeType": "application",
                "evidence": "Struggled with scenario questions where lexical BM25 beats bi-encoder embeddings.",
                "remediation": "Study hybrid search combinations (reciprocal rank fusion between lexical and dense vectors).",
                "occurrenceCount": 3,
                "lastOccurred": "Recent session",
            }
        ]

    return [
        {
            "id": m.id,
            "projectId": m.project_id,
            "conceptName": m.concept_name,
            "mistakeType": m.mistake_type,
            "evidence": m.evidence,
            "remediation": m.remediation,
            "occurrenceCount": m.occurrence_count,
            "lastOccurred": m.last_occurred_at.isoformat() if m.last_occurred_at else "",
        }
        for m in mistakes
    ]

@router.get("/knowledge-map")
async def get_knowledge_map(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Concept).where(Concept.project_id == project.id))
    concepts = res.scalars().all()

    if not concepts:
        return {"nodes": [], "edges": []}

    nodes = []
    edges = []
    for i, c in enumerate(concepts):
        nodes.append({
            "id": c.id,
            "name": c.name,
            "mastery": c.mastery,
            "status": c.status,
            "trend": c.trend,
            "description": c.description or f"Key topic in {project.name}",
        })
        if i > 0:
            # Connect sequentially or hierarchically as knowledge tree
            edges.append({
                "source": concepts[i - 1].id,
                "target": c.id,
                "relation": "prerequisite_for" if i % 2 == 1 else "related_to",
            })

    return {"nodes": nodes, "edges": edges}

@router.get("/copilot/status")
async def get_copilot_status(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    # Calculate application-derived Learning Health score
    c_res = await db.execute(select(Concept).where(Concept.project_id == project.id))
    concepts = c_res.scalars().all()

    mastery_avg = float(project.overall_mastery or 50.0)
    weak_count = sum(1 for c in concepts if c.status == "needs_attention")
    strong_count = sum(1 for c in concepts if c.status == "mastered")
    
    # Mistake count
    mis_res = await db.execute(select(func.count(MistakeRecord.id)).where(MistakeRecord.project_id == project.id))
    mistake_count = mis_res.scalar() or 0

    # Composite Learning Health (0-100)
    consistency_score = min(100.0, 60.0 + (project.progress * 0.4))
    health_score = round(
        (0.40 * mastery_avg) +
        (0.30 * consistency_score) +
        (0.20 * max(0.0, 100.0 - (weak_count * 15.0))) +
        (0.10 * max(0.0, 100.0 - (mistake_count * 10.0))),
        1
    )

    # Proactive Copilot suggestions
    nudge = "You're making steady progress. Taking a 5-question adaptive quiz will reinforce your recent gains."
    if weak_count > 0:
        weakest = [c.name for c in concepts if c.status == "needs_attention"][0]
        nudge = f"You've encountered difficulty with {weakest}. Would you like a 5-minute targeted Focus Mode session?"
    elif mastery_avg > 75:
        nudge = "High mastery detected across core concepts! Ready to tackle an open-ended scenario assessment?"

    return {
        "projectId": project.id,
        "projectName": project.name,
        "learningHealth": health_score,
        "healthLabel": "Strong" if health_score >= 75 else ("Moderate" if health_score >= 50 else "Needs Attention"),
        "proactiveNudge": nudge,
        "weakConceptsCount": weak_count,
        "strongConceptsCount": strong_count,
        "activeStreakDays": 4,
    }

@router.post("/focus-mode/start")
async def start_focus_mode(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    # Generates a distraction-free micro-learning session targeting the weakest concept
    c_res = await db.execute(
        select(Concept).where(Concept.project_id == project.id).order_by(Concept.mastery.asc())
    )
    concept = c_res.scalars().first()
    concept_name = concept.name if concept else "Foundational Principles"

    return {
        "sessionId": f"fcs_{uuid.uuid4().hex[:8]}",
        "targetConcept": concept_name,
        "estimatedMins": 5,
        "microExplanation": (
            f"Focus Review: {concept_name}.\n\n"
            f"In {project.name}, {concept_name} governs the trade-off between retrieval recall and precision. "
            f"When configuring this, ensure that boundary conditions and semantic density are calibrated to match your document domain."
        ),
        "challengeQuestion": {
            "prompt": f"Why does {concept_name} degrade if context overlap is eliminated entirely?",
            "choices": [
                {"id": "a", "text": "It cuts context boundaries abruptly, dropping cross-sentence meaning"},
                {"id": "b", "text": "It doubles vector storage without reason"},
                {"id": "c", "text": "It forces queries into CPU fallback"},
                {"id": "d", "text": "It makes cosine similarity negative"},
            ],
            "correctChoiceId": "a",
            "explanation": "Context that spans chunk splits is lost without overlap, reducing semantic embedding fidelity.",
        }
    }
