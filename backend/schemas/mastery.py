from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

class ConceptResponse(BaseModel):
    id: str
    projectId: str
    name: str
    mastery: float
    trend: str  # 'up', 'down', 'flat'
    status: str  # 'mastered', 'improving', 'needs_attention', 'not_started'

class MasteryHistoryPointResponse(BaseModel):
    date: str
    mastery: float

class MasteryChangeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    conceptId: str
    from_: float = Field(alias="from", serialization_alias="from")
    to: float
    reason: str
    date: str
