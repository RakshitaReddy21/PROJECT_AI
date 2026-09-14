import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.models.concept import Concept
from backend.models.mistake import MistakeRecord
from backend.models.recommendation import Recommendation
from backend.schemas.recommendation import RecommendationResponse
from backend.domains.auth.dependencies import get_current_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("", response_model=List[RecommendationResponse])
async def get_recommendations(
    projectId: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Recommendation).where(Recommendation.is_dismissed == False)
    if projectId:
        query = query.where(Recommendation.project_id == projectId)
    query = query.order_by(Recommendation.created_at.desc())

    result = await db.execute(query)
    recs = result.scalars().all()

    # If none exist, dynamically generate explainable recommendations from concepts
    if not recs and projectId:
        c_res = await db.execute(select(Concept).where(Concept.project_id == projectId))
        concepts = c_res.scalars().all()
        weak = [c for c in concepts if c.status == "needs_attention" or c.mastery < 60]
        target = weak[0] if weak else (concepts[0] if concepts else None)

        if target:
            rec = Recommendation(
                id=f"rc_{uuid.uuid4().hex[:10]}",
                project_id=projectId,
                title=f"Practice {target.name} Fundamentals",
                reason=f"Your mastery in {target.name} is {target.mastery}%, which is currently your key bottleneck.",
                related_concept=target.name,
                evidence=f"Identified as needing attention during recent diagnostic checks.",
                action="quiz",
                priority="high",
                estimated_effort_mins=6,
            )
            db.add(rec)
            await db.commit()
            await db.refresh(rec)
            recs = [rec]

    return [
        RecommendationResponse(
            id=r.id,
            projectId=r.project_id,
            title=r.title,
            reason=r.reason,
            relatedConcept=r.related_concept,
            evidence=r.evidence,
            action=r.action,
            priority=r.priority,
            estimatedEffortMins=r.estimated_effort_mins,
        )
        for r in recs
    ]
