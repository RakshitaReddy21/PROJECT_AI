from pydantic import BaseModel, Field
from typing import Optional, List

class CitationResponse(BaseModel):
    id: str
    materialId: str
    materialName: str
    page: int

class ChatMessageResponse(BaseModel):
    id: str
    conversationId: str
    role: str
    content: str
    citations: Optional[List[CitationResponse]] = None
    unsupported: Optional[bool] = False
    suggestedFollowUps: Optional[List[str]] = None
    createdAt: str

    class Config:
        from_attributes = True

class SendMessageInput(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
