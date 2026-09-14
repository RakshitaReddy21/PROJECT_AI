from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(String, primary_key=True, index=True)
    job_type = Column(String, nullable=False, index=True)  # 'material_processing', 'quiz_generation', 'evaluation_run'
    entity_id = Column(String, nullable=False, index=True)
    status = Column(String, default="queued", nullable=False)  # 'queued', 'running', 'completed', 'failed'
    stage = Column(String, default="queued", nullable=False)
    progress_pct = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    attempts = Column(Integer, default=0, nullable=False)
    meta_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
