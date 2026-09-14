import os
import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.config import settings
from backend.database import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.models.material import Material
from backend.models.activity import ActivityEvent
from backend.schemas.material import MaterialResponse
from backend.domains.auth.dependencies import get_current_user, verify_project_access
from backend.jobs.worker import enqueue_material_processing

router = APIRouter(tags=["materials"])

def format_material_response(mat: Material) -> MaterialResponse:
    return MaterialResponse(
        id=mat.id,
        projectId=mat.project_id,
        filename=mat.filename,
        sizeKb=round(mat.size_kb, 1),
        uploadedAt=mat.created_at.isoformat() if mat.created_at else "",
        status=mat.status,
        stage=mat.stage,
        pages=mat.pages_count,
        conceptsExtracted=mat.concepts_extracted or [],
        searchable=mat.searchable,
        errorMessage=mat.error_message,
    )

@router.get("/projects/{project_id}/materials", response_model=List[MaterialResponse])
async def list_materials(
    project: Project = Depends(verify_project_access),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Material).where(Material.project_id == project.id).order_by(Material.created_at.desc())
    )
    materials = result.scalars().all()
    return [format_material_response(m) for m in materials]

@router.post("/projects/{project_id}/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify project access
    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    project = proj_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")

    material_id = f"mt_{uuid.uuid4().hex[:10]}"
    safe_name = os.path.basename(file.filename)
    dest_path = settings.UPLOAD_DIR / f"{material_id}_{safe_name}"

    # Read and write content
    contents = await file.read()
    size_kb = len(contents) / 1024.0

    with open(dest_path, "wb") as f:
        f.write(contents)

    # Create Material entry
    material = Material(
        id=material_id,
        project_id=project.id,
        filename=safe_name,
        file_path=str(dest_path),
        size_kb=size_kb,
        status="processing",
        stage="uploading",
        pages_count=0,
        concepts_extracted=[],
        searchable=False,
    )
    db.add(material)

    # Activity event
    event = ActivityEvent(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        project_id=project.id,
        project_name=project.name,
        event_type="MATERIAL_UPLOADED",
        summary=f'Uploaded "{safe_name}" ({round(size_kb, 1)} KB)',
        metadata_json={"material_id": material.id, "filename": safe_name},
    )
    db.add(event)

    await db.commit()
    await db.refresh(material)

    # Launch background extraction and chunking pipeline
    enqueue_material_processing(material.id, project.id, str(dest_path))

    return format_material_response(material)

@router.post("/materials/{material_id}/retry", response_model=MaterialResponse)
async def retry_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

    # Verify project access
    proj_res = await db.execute(select(Project).where(Project.id == material.project_id))
    project = proj_res.scalar_one_or_none()
    if not project or (project.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    material.status = "processing"
    material.stage = "uploading"
    material.error_message = None
    await db.commit()
    await db.refresh(material)

    enqueue_material_processing(material.id, material.project_id, material.file_path)
    return format_material_response(material)
