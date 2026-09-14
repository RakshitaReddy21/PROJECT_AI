from pydantic import BaseModel, Field
from typing import Optional, List

class AssessmentResponse(BaseModel):
    id: str
    projectId: str
    prompt: str
    expectationHint: str

class AssessmentSubmitInput(BaseModel):
    answer: str = Field(..., min_length=5, max_length=5000)

class AssessmentResultResponse(BaseModel):
    id: str
    assessmentId: str
    overallScore: float
    understanding: str  # 'strong' | 'developing' | 'needs_attention'
    accuracy: float
    completeness: float
    reasoning: float
    conceptUnderstanding: float
    whatYouUnderstood: str
    whatIsMissing: str
    howToImprove: str
    recommendedNextStep: str
    relatedConcepts: List[str]
    submittedAt: str
