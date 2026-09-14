from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="", nullable=False)
    mastery = Column(Float, default=0.0, nullable=False)
    trend = Column(String, default="flat", nullable=False)  # 'up', 'down', 'flat'
    status = Column(String, default="not_started", nullable=False)  # 'mastered', 'improving', 'needs_attention', 'not_started'
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    project = relationship("Project", back_populates="concepts")
    mastery_records = relationship("MasteryRecord", back_populates="concept", cascade="all, delete-orphan")
    mastery_history = relationship("MasteryHistory", back_populates="concept", cascade="all, delete-orphan")


class ConceptRelationship(Base):
    __tablename__ = "concept_relationships"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    source_concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    target_concept_id = Column(String, ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String, default="prerequisite_for", nullable=False)  # 'prerequisite_for', 'related_to', 'subconcept_of'
