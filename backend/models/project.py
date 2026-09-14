from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    space_id = Column(String, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    learning_goal = Column(Text, default="", nullable=False)
    description = Column(Text, default="", nullable=False)
    expected_outcome = Column(Text, default="", nullable=False)
    target_date = Column(String, nullable=True)
    overall_mastery = Column(Float, default=0.0, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="getting_started", nullable=False)
    last_activity_at = Column(DateTime, default=utcnow, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    space = relationship("Space", back_populates="projects")
    user = relationship("User", back_populates="projects")
    materials = relationship("Material", back_populates="project", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="project", cascade="all, delete-orphan")
    concepts = relationship("Concept", back_populates="project", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="project", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="project", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="project", cascade="all, delete-orphan")
    mistakes = relationship("MistakeRecord", back_populates="project", cascade="all, delete-orphan")
    learning_context = relationship("LearningContext", back_populates="project", uselist=False, cascade="all, delete-orphan")
