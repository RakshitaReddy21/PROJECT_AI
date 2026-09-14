from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class MistakeRecord(Base):
    __tablename__ = "mistake_records"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String, nullable=True)
    concept_name = Column(String, nullable=False)
    mistake_type = Column(String, nullable=False)  # 'conceptual', 'calculation', 'terminology', 'application', 'prerequisite'
    evidence = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    occurrence_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    last_occurred_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="mistakes")
