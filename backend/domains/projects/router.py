import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models.user import User
from backend.models.space import Space
from backend.models.project import Project
from backend.models.concept import Concept
from backend.models.recommendation import Recommendation
from backend.models.learning_context import LearningContext
from backend.models.activity import ActivityEvent
from backend.schemas.project import ProjectCreate, ProjectResponse, ProjectContextResponse
from backend.domains.auth.dependencies import get_current_user, verify_project_access

router = APIRouter(prefix="/projects", tags=["projects"])

def build_project_response(project: Project, space_name: str) -> ProjectResponse:
    last_act_iso = project.last_activity_at.isoformat() if project.last_activity_at else datetime.now(timezone.utc).isoformat()
    created_iso = project.created_at.isoformat() if project.created_at else datetime.now(timezone.utc).isoformat()
    updated_iso = project.updated_at.isoformat() if hasattr(project, 'updated_at') and project.updated_at else created_iso

    proj_title = project.name or "Untitled Project"
    goal = project.learning_goal or "Master core concepts"
    mastery = project.overall_mastery or 0.0

    return ProjectResponse(
        id=project.id,
        spaceId=project.space_id,
        spaceName=space_name,
        name=proj_title,
        title=proj_title,
        learningGoal=goal,
        targetGoal=goal,
        description=project.description or "",
        expectedOutcome=project.expected_outcome or "",
        targetDate=project.target_date,
        overallMastery=mastery,
        masteryScore=mastery,
        progress=project.progress or 0.0,
        materialCount=0,
        conceptCount=0,
        status=project.status or "active",
        lastActivityAt=last_act_iso,
        lastStudiedAt=last_act_iso,
        createdAt=created_iso,
        updatedAt=updated_iso,
    )

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    spaceId: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project, Space.name).join(Space, Project.space_id == Space.id)
    if current_user.role != "admin":
        query = query.where(Project.user_id == current_user.id)
    if spaceId:
        query = query.where(Project.space_id == spaceId)
    query = query.order_by(Project.last_activity_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    return [build_project_response(proj, space_name) for proj, space_name in rows]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    space_res = await db.execute(select(Space.name).where(Space.id == project.space_id))
    space_name = space_res.scalar_one_or_none() or "Space"
    return build_project_response(project, space_name)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    input_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify space ownership
    space_res = await db.execute(select(Space).where(Space.id == input_data.spaceId))
    space = space_res.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    if space.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create project in this space")

    proj_name = input_data.name or input_data.title or "New Learning Project"
    proj_goal = input_data.learningGoal or input_data.targetGoal or "Master key concepts"

    new_project = Project(
        id=f"pr_{uuid.uuid4().hex[:10]}",
        space_id=space.id,
        user_id=current_user.id,
        name=proj_name,
        learning_goal=proj_goal,
        description=input_data.description or "",
        expected_outcome=input_data.expectedOutcome or "",
        target_date=input_data.targetDate,
        overall_mastery=0.0,
        progress=0.0,
        status="getting_started",
        last_activity_at=datetime.now(timezone.utc),
    )
    db.add(new_project)

    # Initialize learning context
    learning_ctx = LearningContext(
        id=f"ctx_{uuid.uuid4().hex[:10]}",
        project_id=new_project.id,
        learning_goal=proj_goal,
        preferences_json={"preferred_style": "interactive", "session_length": 15},
        strengths_json=[],
        weaknesses_json=[],
        recent_focus_json=[],
    )
    db.add(learning_ctx)

    # Activity event
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=new_project.id,
        project_name=new_project.name,
        event_type="PROJECT_CREATED",
        summary=f'Created project "{new_project.name}"',
        metadata_json={"space_id": space.id},
    )
    db.add(event)

    await db.commit()
    await db.refresh(new_project)
    return build_project_response(new_project, space.name)

@router.get("/{project_id}/context", response_model=ProjectContextResponse)
async def get_project_context(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    # Fetch concepts
    concept_res = await db.execute(select(Concept).where(Concept.project_id == project.id))
    concepts = concept_res.scalars().all()
    weak = [c.name for c in concepts if c.status == "needs_attention" or c.mastery < 50]
    strong = [c.name for c in concepts if c.status == "mastered" or c.mastery >= 75]

    # Fetch top recommendation
    rec_res = await db.execute(
        select(Recommendation)
        .where(Recommendation.project_id == project.id, Recommendation.is_dismissed == False)
        .order_by(Recommendation.created_at.desc())
    )
    top_rec = rec_res.scalars().first()
    top_rec_dict = None
    if top_rec:
        top_rec_dict = {
            "id": top_rec.id,
            "title": top_rec.title,
            "reason": top_rec.reason,
            "relatedConcept": top_rec.related_concept,
            "evidence": top_rec.evidence,
            "action": top_rec.action,
        }

    return ProjectContextResponse(
        projectId=project.id,
        projectName=project.name,
        learningGoal=project.learning_goal,
        overallMastery=project.overall_mastery,
        status=project.status,
        weakConcepts=weak,
        strongConcepts=strong,
        topRecommendation=top_rec_dict,
        recentActivitySummary=f"Active in {project.name}",
    )
