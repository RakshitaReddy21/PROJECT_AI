from pydantic import BaseModel, Field
from typing import Optional

class SpaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    color: Optional[str] = "#F29B73"
    icon: Optional[str] = "Folder"

class SpaceResponse(BaseModel):
    id: str
    userId: Optional[str] = None
    name: str
    description: str
    color: Optional[str] = "#F29B73"
    icon: Optional[str] = "Folder"
    projectCount: int
    overallMastery: float
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    lastActivityAt: str
    status: str

    class Config:
        from_attributes = True
