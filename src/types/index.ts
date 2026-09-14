export type Role = 'learner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash?: string;
  salt?: string;
}

export interface Space {
  id: string;
  userId?: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  spaceId: string;
  spaceName?: string;
  title: string;
  description: string;
  targetGoal: string;
  masteryScore: number; // 0 - 100
  materialCount: number;
  conceptCount: number;
  lastStudiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MaterialProcessingStage = 
  | 'uploading'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'graphing'
  | 'ready'
  | 'failed';

export interface Material {
  id: string;
  userId?: string;
  projectId: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  stage: MaterialProcessingStage;
  progress: number; // 0 - 100
  pageCount?: number;
  searchableStatus?: 'indexed' | 'processing' | 'failed';
  extractedConceptsCount: number;
  chunkCount: number;
  errorMessage?: string;
  uploadedAt: string;
}

export type MasteryLevel = 'novice' | 'developing' | 'competent' | 'proficient' | 'master';

export interface Concept {
  id: string;
  projectId: string;
  name: string;
  definition: string;
  category: string;
  masteryLevel: MasteryLevel;
  score: number; // 0 - 100
  trend?: 'up' | 'down' | 'neutral';
  confidence?: 'low' | 'medium' | 'high';
  isWeakness?: boolean;
  parentId?: string; // For concept hierarchy landscape
  recentChange?: number; // e.g. +6, -4
  lastAssessedAt: string;
  changeReason?: string;
  relatedMaterialIds: string[];
}

export interface Citation {
  id: string;
  materialId: string;
  materialTitle: string;
  excerpt: string;
  chunkIndex: number;
}

export interface TutorMessage {
  id: string;
  projectId: string;
  sender: 'user' | 'tutor';
  text: string;
  isGrounded: boolean;
  citations: Citation[];
  isUnsupported: boolean;
  suggestedFollowups?: string[];
  timestamp: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'scenario';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  conceptId: string;
  conceptName: string;
  type: QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizAttempt {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export type TopicClassification = 'strong' | 'needs_improvement' | 'weak';

export interface TopicPerformance {
  conceptId: string;
  conceptName: string;
  correct: number;
  total: number;
  accuracy: number; // 0-100, this quiz attempt only
  classification: TopicClassification;
}

export interface AIRecommendationResult {
  summary: string;
  strongestTopic?: string;
  weakestTopic?: string;
  recommendations: string[];
  nextStep: string;
  isLiveAI: boolean;
}

export interface QuizResult {
  id: string;
  userId?: string;
  projectId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  adaptationRationale: string;
  conceptPerformance: {
    conceptId: string;
    conceptName: string;
    score: number;
    delta: number;
  }[];
  completedAt: string;
  /** Per-topic accuracy computed strictly from THIS quiz attempt's answers (PRD §9). */
  topicPerformance?: TopicPerformance[];
  /** Topic names classified as "weak" (accuracy < 50%) in this attempt, weakest first. */
  weakAreas?: string[];
  /** AI-generated (or, if no model is available, data-derived) study analysis grounded in the quiz results and source PDF. */
  aiRecommendation?: AIRecommendationResult;
}

export interface AssessmentRubricScore {
  criterion: string;
  score: number; // 0 - 100
  feedback: string;
}

export interface AssessmentSubmission {
  id: string;
  userId?: string;
  projectId: string;
  prompt: string;
  studentResponse: string;
  score: number;
  overallFeedback: string;
  rubricScores: AssessmentRubricScore[];
  growthTips: string[];
  submittedAt: string;
}

export interface Recommendation {
  id: string;
  projectId: string;
  projectTitle: string;
  type: 'review_concept' | 'take_quiz' | 'upload_material' | 'complete_assessment';
  title: string;
  reason: string;
  evidence: string;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectTitle?: string;
  type: 'material_uploaded' | 'tutor_queried' | 'quiz_completed' | 'assessment_submitted' | 'mastery_changed';
  description: string;
  timestamp: string;
}

export interface AIUsageMetrics {
  id: string;
  date: string;
  model: string;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostUSD: number;
  averageLatencyMs: number;
  queryCount: number;
}

export interface AIEvaluationMetrics {
  groundednessScore: number; // 0-100
  retrievalRecall: number; // 0-100
  hallucinationRate: number; // 0-100
  assessmentAgreement: number; // 0-100
  recommendationCTR: number; // 0-100
}

export interface LearningGoal {
  id: string;
  projectId: string;
  title: string;
  targetScore: number;
  currentScore: number;
  targetDate: string;
  status: 'in_progress' | 'achieved' | 'needs_attention';
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  userId?: string;
  materialId: string;
  projectId: string;
  chunkIndex: number;
  pageNumber?: number;
  content: string;
  tokenCount: number;
  conceptsMentioned: string[];
}

export interface StructuredLearningContext {
  projectId: string;
  userId?: string;
  projectTitle: string;
  learningGoal: string;
  masteredConcepts: string[];
  weakConcepts: string[];
  recentMistakes: {
    questionId: string;
    question: string;
    conceptName: string;
    selectedOption: string;
    correctOption: string;
    explanation: string;
  }[];
  assessmentHistory: {
    id: string;
    prompt: string;
    score: number;
    weaknesses: string[];
    submittedAt: string;
  }[];
  learningPreferences: {
    explanationDepth: 'concise' | 'balanced' | 'deep_dive';
    pacing: 'relaxed' | 'standard' | 'intensive';
  };
  importantInsights: string[];
}

export interface GrowthInsight {
  projectId: string;
  startingMastery: number;
  currentMastery: number;
  improvement: number;
  strongestConcepts: Concept[];
  weakestConcepts: Concept[];
  recentProgress: string;
  learningConsistency: number; // 0-100%
  narrative: string;
}

export interface BackgroundJob {
  id: string;
  type: 'document_processing' | 'vector_indexing' | 'eval_benchmark' | 'quiz_generation';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  targetEntityId: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  apiLatencyMs: number;
  errorRate: number;
  vectorDbStatus: 'connected' | 'reindexing' | 'error';
  llmProviderStatus: 'operational' | 'rate_limited' | 'down';
}
