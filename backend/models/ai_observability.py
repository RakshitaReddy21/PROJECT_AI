from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class AIRequest(Base):
    __tablename__ = "ai_requests"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    project_id = Column(String, nullable=True, index=True)
    feature = Column(String, nullable=False, index=True)  # 'tutor', 'quiz_generation', 'assessment_grading', 'recommendation', 'concept_extraction'
    model = Column(String, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    cost_usd = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="success", nullable=False)  # 'success', 'error'
    error_message = Column(Text, nullable=True)
    retrieval_latency_ms = Column(Integer, nullable=True)
    source_chunk_ids = Column(JSON, nullable=True)
    prompt_version = Column(String, default="v1", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)


class EvaluationCase(Base):
    __tablename__ = "evaluation_cases"

    id = Column(String, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)  # 'Tutor', 'Retrieval', 'Assessment', 'Recommendation'
    metric = Column(String, nullable=False)
    input_prompt = Column(Text, nullable=False)
    expected_evidence = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    score_target = Column(Float, default=90.0, nullable=False)
    score_achieved = Column(Float, default=90.0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, index=True)
    category = Column(String, nullable=False)
    metric = Column(String, nullable=False)
    score_achieved = Column(Float, nullable=False)
    passed = Column(Boolean, default=True, nullable=False)
    latency_ms = Column(Integer, default=0, nullable=False)
    eval_notes = Column(Text, nullable=False)
    executed_at = Column(DateTime, default=utcnow, nullable=False)
