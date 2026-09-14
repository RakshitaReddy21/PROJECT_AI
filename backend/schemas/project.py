from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ProjectCreate(BaseModel):
    spaceId: str
    name: Optional[str] = None
    title: Optional[str] = None
    learningGoal: Optional[str] = None
    targetGoal: Optional[str] = None
    description: str = Field(default="", max_length=2000)
    expectedOutcome: Optional[str] = Field(default="", max_length=1000)
    targetDate: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    spaceId: str
    spaceName: str
    name: str
    title: str
    learningGoal: str
    targetGoal: str
    description: str
    expectedOutcome: str
    targetDate: Optional[str] = None
    overallMastery: float
    masteryScore: float
    progress: float
    materialCount: int = 0
    conceptCount: int = 0
    status: str
    lastActivityAt: str
    lastStudiedAt: str
    createdAt: str
    updatedAt: str

    class Config:
        from_attributes = True

class ProjectContextResponse(BaseModel):
    projectId: str
    projectName: str
    learningGoal: str
    overallMastery: float
    status: str
    weakConcepts: List[str]
    strongConcepts: List[str]
    topRecommendation: Optional[Dict[str, Any]] = None
    recentActivitySummary: Optional[str] = None
