from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class LearningContext(Base):
    __tablename__ = "learning_contexts"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    learning_goal = Column(Text, default="", nullable=False)
    preferences_json = Column(JSON, default=dict, nullable=False)
    strengths_json = Column(JSON, default=list, nullable=False)
    weaknesses_json = Column(JSON, default=list, nullable=False)
    recent_focus_json = Column(JSON, default=list, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    project = relationship("Project", back_populates="learning_context")
