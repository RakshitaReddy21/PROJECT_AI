from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChoiceSchema(BaseModel):
    id: str
    text: str

class QuizQuestionSchema(BaseModel):
    id: str
    type: str  # 'multiple_choice', 'true_false', 'scenario'
    prompt: str
    choices: List[ChoiceSchema]
    correctChoiceId: str
    explanation: str
    concept: str

class QuizResponse(BaseModel):
    id: str
    projectId: str
    topic: str
    reason: str
    estimatedMinutes: int
    difficulty: str
    questions: List[QuizQuestionSchema]

class QuizAnswerSubmit(BaseModel):
    questionId: str
    choiceId: str
    correct: Optional[bool] = False

class QuizSubmitInput(BaseModel):
    answers: List[QuizAnswerSubmit]

class ConceptPerformanceItem(BaseModel):
    concept: str
    accuracy: float

class QuizResultResponse(BaseModel):
    id: str
    quizId: str
    score: float
    accuracy: float
    answers: List[Dict[str, Any]]
    conceptPerformance: List[ConceptPerformanceItem]
    weakConcepts: List[str]
    strongConcepts: List[str]
    completedAt: str
