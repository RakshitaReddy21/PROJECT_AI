from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    expectation_hint = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="assessments")
    submissions = relationship("AssessmentSubmission", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"

    id = Column(String, primary_key=True, index=True)
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    answer_text = Column(Text, nullable=False)
    overall_score = Column(Float, nullable=False)
    understanding = Column(String, nullable=False)  # 'strong', 'developing', 'needs_attention'
    accuracy = Column(Float, nullable=False)
    completeness = Column(Float, nullable=False)
    reasoning = Column(Float, nullable=False)
    concept_understanding = Column(Float, nullable=False)
    what_understood = Column(Text, nullable=False)
    what_missing = Column(Text, nullable=False)
    how_to_improve = Column(Text, nullable=False)
    recommended_next_step = Column(Text, nullable=False)
    related_concepts = Column(JSON, default=list, nullable=False)
    submitted_at = Column(DateTime, default=utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="submissions")
