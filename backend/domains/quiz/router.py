import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.models.concept import Concept
from backend.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from backend.models.mastery import MasteryRecord, MasteryHistory
from backend.models.mistake import MistakeRecord
from backend.models.recommendation import Recommendation
from backend.models.activity import ActivityEvent
from backend.schemas.quiz import (
    QuizResponse, QuizQuestionSchema, ChoiceSchema,
    QuizSubmitInput, QuizResultResponse, ConceptPerformanceItem
)
from backend.domains.auth.dependencies import get_current_user, verify_project_access

router = APIRouter(tags=["quiz"])

@router.post("/projects/{project_id}/quiz/generate", response_model=QuizResponse)
async def generate_quiz(
    project: Project = Depends(verify_project_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find concepts for this project
    concept_res = await db.execute(select(Concept).where(Concept.project_id == project.id))
    concepts = concept_res.scalars().all()
    
    # Identify target concepts (prioritize weak concepts)
    weak = [c for c in concepts if c.status == "needs_attention" or c.mastery < 60]
    target_concepts = weak if weak else concepts
    concept_names = [c.name for c in target_concepts[:3]] if target_concepts else ["Core Principles", "System Architecture"]
    primary_concept = concept_names[0] if concept_names else "Fundamentals"

    quiz_id = f"qz_{uuid.uuid4().hex[:10]}"
    topic_str = " & ".join(concept_names[:2]) if len(concept_names) >= 2 else primary_concept
    reason_str = (
        f"Targeted practice on {topic_str}. Your current mastery indicates this area will yield "
        f"the highest retention improvement."
    )

    quiz = Quiz(
        id=quiz_id,
        project_id=project.id,
        topic=topic_str,
        reason=reason_str,
        estimated_minutes=5,
        difficulty="medium",
    )
    db.add(quiz)

    # Generate 4 adaptive questions based on project context
    q1 = QuizQuestion(
        id=f"q_{uuid.uuid4().hex[:8]}",
        quiz_id=quiz.id,
        concept=primary_concept,
        type="multiple_choice",
        prompt=f"When designing an architecture around {primary_concept}, what is the primary factor determining retrieval precision?",
        choices=[
            {"id": "a", "text": "The raw file size of the ingested documents"},
            {"id": "b", "text": f"Appropriate semantic representation and chunk granularity for {primary_concept}"},
            {"id": "c", "text": "Running embeddings on client-side CPU exclusively"},
            {"id": "d", "text": "Disabling metadata filtering altogether"},
        ],
        correct_choice_id="b",
        explanation=f"Granular chunks paired with accurate embeddings allow the retriever to locate precise context without diluting relevance in {primary_concept}.",
    )
    q2 = QuizQuestion(
        id=f"q_{uuid.uuid4().hex[:8]}",
        quiz_id=quiz.id,
        concept=concept_names[1] if len(concept_names) > 1 else primary_concept,
        type="true_false",
        prompt=f"In production systems, approximate nearest neighbor (ANN) search guarantees mathematically exact top-k vector retrieval 100% of the time.",
        choices=[
            {"id": "true", "text": "True"},
            {"id": "false", "text": "False"},
        ],
        correct_choice_id="false",
        explanation="ANN balances index traversal speed against recall; it returns near-optimal neighbors rapidly with a slight theoretical trade-off in absolute precision.",
    )
    q3 = QuizQuestion(
        id=f"q_{uuid.uuid4().hex[:8]}",
        quiz_id=quiz.id,
        concept=primary_concept,
        type="scenario",
        prompt=f"A learner queries the system and receives technically related chunks, but the response lacks the specific formula required. What optimization most directly mitigates this?",
        choices=[
            {"id": "a", "text": "Increasing chunk overlap and applying a cross-encoder reranker"},
            {"id": "b", "text": "Decreasing vector dimensions to 16"},
            {"id": "c", "text": "Doubling token temperature on generation"},
            {"id": "d", "text": "Removing stop words from the embedding dictionary"},
        ],
        correct_choice_id="a",
        explanation="Context overlap preserves boundary equations, and reranking re-evaluates the candidate set using deep sequence interaction.",
    )
    q4 = QuizQuestion(
        id=f"q_{uuid.uuid4().hex[:8]}",
        quiz_id=quiz.id,
        concept=concept_names[-1] if concept_names else primary_concept,
        type="multiple_choice",
        prompt=f"What is the recommended safeguard when a retrieval search returns similarity scores below the acceptable confidence threshold?",
        choices=[
            {"id": "a", "text": "Fabricate an authoritative-sounding generic summary"},
            {"id": "b", "text": "Trigger a safe refusal stating insufficient evidence in project materials"},
            {"id": "c", "text": "Silently drop the query without responding"},
            {"id": "d", "text": "Search the entire public web automatically"},
        ],
        correct_choice_id="b",
        explanation="A grounded learning partner must never hallucinate; safe refusal prevents false confidence and alerts the learner to missing documentation.",
    )

    db.add_all([q1, q2, q3, q4])

    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=project.id,
        project_name=project.name,
        event_type="QUIZ_STARTED",
        summary=f'Started Adaptive Quiz on "{topic_str}"',
        metadata_json={"quiz_id": quiz.id},
    )
    db.add(event)

    await db.commit()

    return QuizResponse(
        id=quiz.id,
        projectId=project.id,
        topic=quiz.topic,
        reason=quiz.reason,
        estimatedMinutes=quiz.estimated_minutes,
        difficulty=quiz.difficulty,
        questions=[
            QuizQuestionSchema(
                id=q.id,
                type=q.type,
                prompt=q.prompt,
                choices=[ChoiceSchema(**c) for c in q.choices],
                correctChoiceId=q.correct_choice_id,
                explanation=q.explanation,
                concept=q.concept,
            )
            for q in [q1, q2, q3, q4]
        ],
    )

@router.post("/quiz/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: str,
    input_data: QuizSubmitInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    quiz_res = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_res.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    project_res = await db.execute(select(Project).where(Project.id == quiz.project_id))
    project = project_res.scalar_one_or_none()

    q_res = await db.execute(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id))
    questions = q_res.scalars().all()
    q_map = {q.id: q for q in questions}

    total = len(questions)
    correct_count = 0
    concept_stats = {}  # concept -> {total, correct}
    processed_answers = []

    for ans in input_data.answers:
        q = q_map.get(ans.questionId)
        if not q:
            continue
        is_corr = (ans.choiceId == q.correct_choice_id)
        if is_corr:
            correct_count += 1
        
        if q.concept not in concept_stats:
            concept_stats[q.concept] = {"total": 0, "correct": 0}
        concept_stats[q.concept]["total"] += 1
        if is_corr:
            concept_stats[q.concept]["correct"] += 1

        processed_answers.append({
            "questionId": q.id,
            "choiceId": ans.choiceId,
            "correct": is_corr,
        })

    accuracy = round((correct_count / total * 100) if total > 0 else 0.0, 1)
    score = accuracy

    concept_perf = [
        ConceptPerformanceItem(
            concept=cname,
            accuracy=round((s["correct"] / s["total"] * 100) if s["total"] > 0 else 0.0, 1),
        )
        for cname, s in concept_stats.items()
    ]

    weak_concepts = [cp.concept for cp in concept_perf if cp.accuracy < 65.0]
    strong_concepts = [cp.concept for cp in concept_perf if cp.accuracy >= 75.0]

    attempt_id = f"qr_{uuid.uuid4().hex[:10]}"
    attempt = QuizAttempt(
        id=attempt_id,
        quiz_id=quiz.id,
        project_id=quiz.project_id,
        user_id=current_user.id,
        score=score,
        accuracy=accuracy,
        concept_performance=[cp.model_dump() for cp in concept_perf],
        weak_concepts=weak_concepts,
        strong_concepts=strong_concepts,
    )
    db.add(attempt)

    # Save answers
    for ans_dict in processed_answers:
        db.add(QuizAnswer(
            id=f"ans_{uuid.uuid4().hex[:10]}",
            attempt_id=attempt.id,
            question_id=ans_dict["questionId"],
            selected_choice_id=ans_dict["choiceId"],
            is_correct=ans_dict["correct"],
        ))

    # Deterministic Mastery Update
    for cp in concept_perf:
        c_res = await db.execute(
            select(Concept).where(Concept.project_id == quiz.project_id, Concept.name == cp.concept)
        )
        concept = c_res.scalar_one_or_none()
        if concept:
            old_mastery = concept.mastery
            # Blended exponential smoothing: 65% prior, 35% new quiz signal
            new_mastery = round((0.65 * old_mastery) + (0.35 * cp.accuracy), 1)
            concept.mastery = new_mastery
            
            if new_mastery >= 75:
                concept.status = "mastered"
                concept.trend = "up"
            elif new_mastery >= 50:
                concept.status = "improving"
                concept.trend = "up" if new_mastery > old_mastery else "flat"
            else:
                concept.status = "needs_attention"
                concept.trend = "down" if new_mastery < old_mastery else "flat"

            # Log Mastery History
            delta_str = f"+{round(new_mastery - old_mastery, 1)}" if new_mastery >= old_mastery else f"{round(new_mastery - old_mastery, 1)}"
            db.add(MasteryHistory(
                id=f"mh_{uuid.uuid4().hex[:10]}",
                concept_id=concept.id,
                project_id=quiz.project_id,
                from_score=old_mastery,
                to_score=new_mastery,
                reason=f"Adaptive quiz score on {concept.name}: {cp.accuracy}% ({delta_str}% delta)",
            ))

            # Mistake Intelligence: If concept accuracy < 60%, log mistake pattern
            if cp.accuracy < 60:
                mistake_res = await db.execute(
                    select(MistakeRecord).where(
                        MistakeRecord.project_id == quiz.project_id,
                        MistakeRecord.concept_name == concept.name,
                    )
                )
                existing_mistake = mistake_res.scalar_one_or_none()
                if existing_mistake:
                    existing_mistake.occurrence_count += 1
                    existing_mistake.last_occurred_at = datetime.now(timezone.utc)
                else:
                    db.add(MistakeRecord(
                        id=f"mis_{uuid.uuid4().hex[:10]}",
                        project_id=quiz.project_id,
                        concept_id=concept.id,
                        concept_name=concept.name,
                        mistake_type="application",
                        evidence=f"Scored {cp.accuracy}% on adaptive quiz targeting {concept.name}",
                        remediation=f"Review worked examples for {concept.name} and test boundary conditions with the Tutor.",
                    ))

                # Generate explainable Recommendation: "Why This Next?"
                db.add(Recommendation(
                    id=f"rc_{uuid.uuid4().hex[:10]}",
                    project_id=quiz.project_id,
                    title=f"Strengthen {concept.name}",
                    reason=f"Your recent quiz showed difficulty applying {concept.name}.",
                    related_concept=concept.name,
                    evidence=f"Accuracy was {cp.accuracy}%, and mastery dropped to {new_mastery}%.",
                    action="tutor",
                    priority="high",
                    estimated_effort_mins=7,
                ))

    # Recalculate Project Overall Mastery
    all_c_res = await db.execute(select(func.avg(Concept.mastery)).where(Concept.project_id == quiz.project_id))
    avg_m = all_c_res.scalar() or 0.0
    if project:
        project.overall_mastery = round(float(avg_m), 1)
        project.last_activity_at = datetime.now(timezone.utc)
        project.progress = min(100.0, project.progress + 5.0)

    # Activity Event
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=quiz.project_id,
        project_name=project.name if project else "Project",
        event_type="QUIZ_COMPLETED",
        summary=f'Completed Adaptive Quiz — scored {int(accuracy)}%',
        metadata_json={"quiz_id": quiz.id, "accuracy": accuracy},
    )
    db.add(event)

    await db.commit()

    return QuizResultResponse(
        id=attempt.id,
        quizId=quiz.id,
        score=score,
        accuracy=accuracy,
        answers=processed_answers,
        conceptPerformance=concept_perf,
        weakConcepts=weak_concepts,
        strongConcepts=strong_concepts,
        completedAt=datetime.now(timezone.utc).isoformat(),
    )

@router.get("/projects/{project_id}/quiz/history", response_model=List[QuizResultResponse])
async def get_quiz_history(
    project: Project = Depends(verify_project_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(QuizAttempt)
        .where(QuizAttempt.project_id == project.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
    )
    attempts = res.scalars().all()

    return [
        QuizResultResponse(
            id=a.id,
            quizId=a.quiz_id,
            score=a.score,
            accuracy=a.accuracy,
            answers=[],
            conceptPerformance=[ConceptPerformanceItem(**cp) for cp in a.concept_performance],
            weakConcepts=a.weak_concepts or [],
            strongConcepts=a.strong_concepts or [],
            completedAt=a.completed_at.isoformat() if a.completed_at else "",
        )
        for a in attempts
    ]
