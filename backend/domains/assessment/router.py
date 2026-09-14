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
from backend.models.assessment import Assessment, AssessmentSubmission
from backend.models.mastery import MasteryHistory
from backend.models.mistake import MistakeRecord
from backend.models.recommendation import Recommendation
from backend.models.activity import ActivityEvent
from backend.models.ai_observability import AIRequest
from backend.schemas.assessment import AssessmentResponse, AssessmentSubmitInput, AssessmentResultResponse
from backend.domains.auth.dependencies import get_current_user, verify_project_access
from backend.ai.prompts import ASSESSMENT_EVALUATION_PROMPT_V1
from backend.ai.providers import get_llm_provider

router = APIRouter(tags=["assessment"])

@router.post("/projects/{project_id}/assessment/generate", response_model=AssessmentResponse)
async def generate_assessment(
    project: Project = Depends(verify_project_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find existing or generate new
    c_res = await db.execute(select(Concept.name).where(Concept.project_id == project.id).limit(2))
    concepts = c_res.scalars().all()
    concept_str = " & ".join(concepts) if concepts else project.name

    assessment = Assessment(
        id=f"as_{uuid.uuid4().hex[:10]}",
        project_id=project.id,
        prompt=(
            f"Explain, in your own words, why {concept_str} systems might fail or produce ungrounded outputs, "
            f"and what architectural safeguards most effectively reduce that risk."
        ),
        expectation_hint=(
            f"A strong answer connects retrieval quality, grounding, and citation checks, and names "
            f"at least one concrete mitigation (e.g., confidence thresholds, reranking, citation verification)."
        ),
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return AssessmentResponse(
        id=assessment.id,
        projectId=project.id,
        prompt=assessment.prompt,
        expectationHint=assessment.expectation_hint,
    )

@router.post("/assessment/{assessment_id}/submit", response_model=AssessmentResultResponse)
async def submit_assessment(
    assessment_id: str,
    input_data: AssessmentSubmitInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    as_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = as_res.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    project_res = await db.execute(select(Project).where(Project.id == assessment.project_id))
    project = project_res.scalar_one_or_none()

    # Rubric-based evaluation
    text = input_data.answer.lower()
    
    # Calculate rubric criteria
    has_retrieval = any(w in text for w in ["retriev", "chunk", "search", "vector", "embed", "relevance"])
    has_grounding = any(w in text for w in ["ground", "cite", "citation", "hallucinat", "evidence", "verif"])
    has_mitigation = any(w in text for w in ["rerank", "threshold", "refus", "filter", "prompt", "safeguard", "metric"])
    word_count = len(text.split())

    accuracy = 85.0 if has_grounding else 65.0
    completeness = min(95.0, 50.0 + (word_count * 0.8))
    reasoning = 80.0 if (has_retrieval and has_mitigation) else 65.0
    concept_understanding = round((accuracy + reasoning) / 2.0, 1)
    
    overall_score = round((accuracy * 0.35) + (completeness * 0.25) + (reasoning * 0.40), 1)

    if overall_score >= 80:
        understanding = "strong"
        what_understood = "You clearly articulated the mechanisms causing ungrounded answers and identified appropriate architectural mitigations."
        what_missing = "Your answer could further elaborate on quantitative evaluation metrics (such as RAGAS groundedness scoring)."
        how_to_improve = "Practice explaining how confidence thresholds interact with safe refusal during edge cases."
        rec_step = "Take on an advanced scenario quiz to solidify your understanding."
    elif overall_score >= 60:
        understanding = "developing"
        what_understood = "You correctly identified that weak retrieval context leads to fluent but incorrect answers."
        what_missing = "Your response omitted specific verification mechanisms (such as citation checks or confidence thresholds)."
        how_to_improve = "Review the evaluation sections of your project materials and test the Tutor on failure recovery strategies."
        rec_step = "Review grounding safeguards with the Tutor, then retake a targeted assessment."
    else:
        understanding = "needs_attention"
        what_understood = "You recognized that models can produce incorrect answers."
        what_missing = "Your answer lacked the technical connection to retrieval quality, chunking, or post-retrieval verification."
        how_to_improve = "Focus on the relationship between embedding similarity and safe refusal thresholds."
        rec_step = "Start a 7-minute focused practice session on core grounding principles."

    # Identify related concepts from project
    c_res = await db.execute(select(Concept).where(Concept.project_id == assessment.project_id))
    all_concepts = c_res.scalars().all()
    related_names = [c.name for c in all_concepts[:3]] if all_concepts else ["Grounding", "Evaluation"]

    # Save submission
    submission = AssessmentSubmission(
        id=f"ar_{uuid.uuid4().hex[:10]}",
        assessment_id=assessment.id,
        project_id=assessment.project_id,
        user_id=current_user.id,
        answer_text=input_data.answer,
        overall_score=overall_score,
        understanding=understanding,
        accuracy=accuracy,
        completeness=completeness,
        reasoning=reasoning,
        concept_understanding=concept_understanding,
        what_understood=what_understood,
        what_missing=what_missing,
        how_to_improve=how_to_improve,
        recommended_next_step=rec_step,
        related_concepts=related_names,
    )
    db.add(submission)

    # Deterministic Mastery Update for related concepts
    for concept in all_concepts[:2]:
        old_m = concept.mastery
        # Blended update
        new_m = round((0.6 * old_m) + (0.4 * overall_score), 1)
        concept.mastery = new_m
        if new_m >= 75:
            concept.status = "mastered"
            concept.trend = "up"
        elif new_m >= 50:
            concept.status = "improving"
            concept.trend = "up" if new_m > old_m else "flat"
        else:
            concept.status = "needs_attention"
            concept.trend = "down" if new_m < old_m else "flat"

        db.add(MasteryHistory(
            id=f"mh_{uuid.uuid4().hex[:10]}",
            concept_id=concept.id,
            project_id=assessment.project_id,
            from_score=old_m,
            to_score=new_m,
            reason=f"Open-ended assessment evaluation score: {overall_score}%",
        ))

    # Mistake Intelligence if score is low
    if overall_score < 70:
        db.add(MistakeRecord(
            id=f"mis_{uuid.uuid4().hex[:10]}",
            project_id=assessment.project_id,
            concept_id=all_concepts[0].id if all_concepts else None,
            concept_name=all_concepts[0].name if all_concepts else "Core Mechanisms",
            mistake_type="conceptual",
            evidence=f"Open-ended response showed conceptual gaps in verification safeguards (score: {overall_score}%).",
            remediation=how_to_improve,
        ))

    # Activity Event
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=assessment.project_id,
        project_name=project.name if project else "Project",
        event_type="ASSESSMENT_COMPLETED",
        summary=f'Completed Open-Ended Assessment — scored {int(overall_score)}% ({understanding})',
        metadata_json={"assessment_id": assessment.id, "score": overall_score},
    )
    db.add(event)

    # Update project overall mastery
    avg_res = await db.execute(select(func.avg(Concept.mastery)).where(Concept.project_id == assessment.project_id))
    avg_score = avg_res.scalar() or 0.0
    if project:
        project.overall_mastery = round(float(avg_score), 1)
        project.last_activity_at = datetime.now(timezone.utc)
        project.progress = min(100.0, project.progress + 10.0)

    await db.commit()

    return AssessmentResultResponse(
        id=submission.id,
        assessmentId=assessment.id,
        overallScore=overall_score,
        understanding=understanding,
        accuracy=accuracy,
        completeness=completeness,
        reasoning=reasoning,
        conceptUnderstanding=concept_understanding,
        whatYouUnderstood=what_understood,
        whatIsMissing=what_missing,
        howToImprove=how_to_improve,
        recommendedNextStep=rec_step,
        relatedConcepts=related_names,
        submittedAt=datetime.now(timezone.utc).isoformat(),
    )
