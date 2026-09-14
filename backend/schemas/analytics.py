from pydantic import BaseModel
from typing import List, Optional

class AnalyticsPoint(BaseModel):
    date: str
    value: float

class ProjectAnalyticsResponse(BaseModel):
    projectId: str
    sessions: int
    tutorQuestions: int
    quizAttempts: int
    questionsAnswered: int
    materialInteractions: int
    quizAccuracy: float
    currentMastery: float
    conceptsMastered: int
    conceptsNeedingAttention: int
    masteryTrend: List[AnalyticsPoint]
    assessmentTrend: List[AnalyticsPoint]
    activityTrend: List[AnalyticsPoint]
    tutorInteractions: int
    aiAssessmentsGenerated: int
    aiEvaluations: int
    recommendationsGenerated: int

class GlobalAnalyticsResponse(BaseModel):
    totalActivity: int
    activeDays: int
    spaces: int
    projects: int
    overallMastery: float
    avgAssessmentScore: float
    improvingConcepts: int
    conceptsNeedingAttention: int
    tutorInteractions: int
    questionsAsked: int
    quizActivity: int
    aiFeedbackGenerated: int
    activityTrend: List[AnalyticsPoint]
    masteryTrend: List[AnalyticsPoint]
    assessmentTrend: List[AnalyticsPoint]

class LearningEventResponse(BaseModel):
    id: str
    type: str
    projectId: Optional[str] = None
    projectName: Optional[str] = None
    userId: Optional[str] = None
    userName: Optional[str] = None
    summary: str
    createdAt: str
