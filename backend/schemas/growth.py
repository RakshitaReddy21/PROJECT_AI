from pydantic import BaseModel
from typing import Optional, List

class GrowthInsightResponse(BaseModel):
    id: str
    projectId: str
    text: str
    kind: str  # 'positive', 'attention', 'pattern'

class GrowthSummaryResponse(BaseModel):
    projectId: str
    overallMasteryDelta: float
    windowDays: int
    strongestImprovement: str
    mainAreaForImprovement: str
    narrative: str
