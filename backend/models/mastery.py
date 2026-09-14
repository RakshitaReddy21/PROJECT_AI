from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class MasteryRecord(Base):
    __tablename__ = "mastery_records"

    id = Column(String, primary_key=True, index=True)
    concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, default=0.0, nullable=False)
    trend = Column(String, default="flat", nullable=False)  # 'up', 'down', 'flat'
    status = Column(String, default="not_started", nullable=False)  # 'mastered', 'improving', 'needs_attention', 'not_started'
    last_evaluated_at = Column(DateTime, default=utcnow, nullable=False)

    concept = relationship("Concept", back_populates="mastery_records")


class MasteryHistory(Base):
    __tablename__ = "mastery_history"

    id = Column(String, primary_key=True, index=True)
    concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    from_score = Column(Float, nullable=False)
    to_score = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    recorded_at = Column(DateTime, default=utcnow, nullable=False)

    concept = relationship("Concept", back_populates="mastery_history")
