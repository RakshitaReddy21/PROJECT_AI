from pydantic import BaseModel
from typing import Optional, List

class AdminUserRowResponse(BaseModel):
    id: str
    name: str
    email: str
    registeredAt: str
    lastActiveAt: str
    spaces: int
    projects: int
    overallProgress: float
    status: str

class AIUsageRecordResponse(BaseModel):
    id: str
    timestamp: str
    feature: str
    model: str
    latencyMs: int
    inputTokens: int
    outputTokens: int
    costUsd: float
    status: str

class AIEvaluationScoreResponse(BaseModel):
    category: str
    metric: str
    score: float
    target: float

class SystemHealthStatusResponse(BaseModel):
    service: str
    status: str
    latencyMs: Optional[int] = None
    errorRate: Optional[float] = None

class SystemFailureResponse(BaseModel):
    id: str
    time: str
    service: str
    operation: str
    error: str
    status: str
