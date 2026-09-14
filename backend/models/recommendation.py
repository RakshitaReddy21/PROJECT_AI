from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    related_concept = Column(String, nullable=False)
    evidence = Column(Text, nullable=False)
    action = Column(String, nullable=False)  # 'tutor', 'quiz', 'material_review'
    priority = Column(String, default="medium", nullable=False)  # 'high', 'medium', 'low'
    estimated_effort_mins = Column(Integer, default=7, nullable=False)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="recommendations")
