import {
  User,
  Space,
  Project,
  Material,
  Concept,
  TutorMessage,
  QuizQuestion,
  QuizResult,
  AssessmentSubmission,
  Recommendation,
  ActivityItem,
  AIUsageMetrics,
  AIEvaluationMetrics,
  SystemHealth,
  DocumentChunk,
  LearningGoal,
} from '../types';

export const mockUsers: User[] = [];

export const mockSpaces: Space[] = [];

export const mockProjects: Project[] = [];

export const mockMaterials: Material[] = [];

export const mockConcepts: Concept[] = [];

export const mockTutorMessages: TutorMessage[] = [];

export const mockQuizQuestions: QuizQuestion[] = [];

export const mockQuizResults: QuizResult[] = [];

export const mockAssessmentSubmission: AssessmentSubmission | null = null;

export const mockRecommendations: Recommendation[] = [];

export const mockActivities: ActivityItem[] = [];

export const mockAIUsage: AIUsageMetrics[] = [];

export const mockAIEvaluation: AIEvaluationMetrics = {
  groundednessScore: 98.5,
  retrievalRecall: 96.2,
  hallucinationRate: 0.8,
  assessmentAgreement: 94.0,
  recommendationCTR: 88.5,
};

export const mockSystemHealth: SystemHealth = {
  status: 'healthy',
  uptimeSeconds: 86400,
  apiLatencyMs: 28,
  errorRate: 0.00,
  vectorDbStatus: 'connected',
  llmProviderStatus: 'operational',
};

export const mockDocumentChunks: DocumentChunk[] = [];

export const mockLearningGoals: Record<string, LearningGoal> = {};
