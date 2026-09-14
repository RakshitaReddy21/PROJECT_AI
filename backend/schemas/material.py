from pydantic import BaseModel
from typing import Optional, List

class MaterialResponse(BaseModel):
    id: str
    projectId: str
    filename: str
    sizeKb: float
    uploadedAt: str
    status: str
    stage: str
    pages: Optional[int] = 0
    conceptsExtracted: List[str]
    searchable: bool
    errorMessage: Optional[str] = None

    class Config:
        from_attributes = True
