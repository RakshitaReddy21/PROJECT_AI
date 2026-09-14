import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.user import User
from backend.models.space import Space
from backend.models.project import Project
from backend.models.activity import ActivityEvent
from backend.schemas.space import SpaceCreate, SpaceResponse
from backend.domains.auth.dependencies import get_current_user, verify_space_access

router = APIRouter(prefix="/spaces", tags=["spaces"])

async def build_space_response(space: Space, db: AsyncSession) -> SpaceResponse:
    # Compute project count and average mastery
    result = await db.execute(
        select(
            func.count(Project.id),
            func.coalesce(func.avg(Project.overall_mastery), 0.0),
            func.max(Project.last_activity_at),
        ).where(Project.space_id == space.id)
    )
    count, avg_mastery, max_activity = result.one()
    
    last_act = max_activity if max_activity else space.updated_at
    created_iso = space.created_at.isoformat() if space.created_at else datetime.now(timezone.utc).isoformat()
    updated_iso = space.updated_at.isoformat() if space.updated_at else datetime.now(timezone.utc).isoformat()

    return SpaceResponse(
        id=space.id,
        userId=space.user_id,
        name=space.name,
        description=space.description,
        color="#F29B73",
        icon="Folder",
        projectCount=int(count or 0),
        overallMastery=round(float(avg_mastery or 0.0), 1),
        createdAt=created_iso,
        updatedAt=updated_iso,
        lastActivityAt=last_act.isoformat() if last_act else updated_iso,
        status=space.status,
    )

@router.get("", response_model=List[SpaceResponse])
async def list_spaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Space)
    if current_user.role != "admin":
        query = query.where(Space.user_id == current_user.id)
    query = query.order_by(Space.created_at.desc())
    
    result = await db.execute(query)
    spaces = result.scalars().all()
    
    return [await build_space_response(s, db) for s in spaces]

@router.get("/{space_id}", response_model=SpaceResponse)
async def get_space(
    space: Space = Depends(verify_space_access),
    db: AsyncSession = Depends(get_db),
):
    return await build_space_response(space, db)

@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(
    input_data: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_space = Space(
        id=f"sp_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        name=input_data.name,
        description=input_data.description,
        status="active",
    )
    db.add(new_space)
    
    # Activity event
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        event_type="SPACE_CREATED",
        summary=f'Created space "{new_space.name}"',
        metadata_json={"space_id": new_space.id},
    )
    db.add(event)
    await db.commit()
    await db.refresh(new_space)
    
    return await build_space_response(new_space, db)
