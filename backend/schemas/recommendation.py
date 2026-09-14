from pydantic import BaseModel
from typing import Optional

class RecommendationResponse(BaseModel):
    id: str
    projectId: str
    title: str
    reason: str
    relatedConcept: str
    evidence: str
    action: str  # 'tutor' | 'quiz' | 'material_review'
    priority: Optional[str] = "medium"
    estimatedEffortMins: Optional[int] = 7

    class Config:
        from_attributes = True
