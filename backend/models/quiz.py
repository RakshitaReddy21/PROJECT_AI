from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    estimated_minutes = Column(Integer, default=5, nullable=False)
    difficulty = Column(String, default="medium", nullable=False)  # 'easy', 'medium', 'hard'
    created_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    concept = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'multiple_choice', 'true_false', 'scenario'
    prompt = Column(Text, nullable=False)
    choices = Column(JSON, nullable=False)  # list of {id, text}
    correct_choice_id = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False)
    concept_performance = Column(JSON, default=list, nullable=False)
    weak_concepts = Column(JSON, default=list, nullable=False)
    strong_concepts = Column(JSON, default=list, nullable=False)
    completed_at = Column(DateTime, default=utcnow, nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String, primary_key=True, index=True)
    attempt_id = Column(String, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_choice_id = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
