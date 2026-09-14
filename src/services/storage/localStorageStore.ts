import {
  User,
  Space,
  Project,
  LearningGoal,
  Material,
  DocumentChunk,
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
  BackgroundJob,
  StructuredLearningContext,
  StoredUser,
} from '../../types';
import {
  mockUsers,
  mockSpaces,
  mockProjects,
  mockMaterials,
  mockConcepts,
  mockTutorMessages,
  mockQuizQuestions,
  mockQuizResults,
  mockAssessmentSubmission,
  mockRecommendations,
  mockActivities,
  mockAIUsage,
  mockAIEvaluation,
  mockSystemHealth,
  mockDocumentChunks,
  mockLearningGoals,
} from '../../mocks/data';

export interface AppState {
  users: StoredUser[];
  spaces: Space[];
  projects: Project[];
  learningGoals: Record<string, LearningGoal>;
  materials: Material[];
  documentChunks: DocumentChunk[];
  concepts: Concept[];
  tutorMessages: Record<string, TutorMessage[]>;
  quizQuestions: Record<string, QuizQuestion[]>;
  quizResults: Record<string, QuizResult[]>;
  assessmentSubmissions: Record<string, AssessmentSubmission[]>;
  recommendations: Recommendation[];
  activities: ActivityItem[];
  aiUsage: AIUsageMetrics[];
  aiEvaluation: AIEvaluationMetrics;
  systemHealth: SystemHealth;
  backgroundJobs: BackgroundJob[];
  learningContexts: Record<string, StructuredLearningContext>;
}

const STORAGE_KEY = 'aurelia_study_companion_state_v2';

function getInitialState(): AppState {
  return {
    users: [],
    spaces: [],
    projects: [],
    learningGoals: {},
    materials: [],
    documentChunks: [],
    concepts: [],
    tutorMessages: {},
    quizQuestions: {},
    quizResults: {},
    assessmentSubmissions: {},
    recommendations: [],
    activities: [],
    aiUsage: [],
    aiEvaluation: { ...mockAIEvaluation },
    systemHealth: { ...mockSystemHealth },
    backgroundJobs: [],
    learningContexts: {},
  };
}

class LocalStorageStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.load();
  }

  private load(): AppState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const initial = getInitialState();

          // Filter out static hardcoded demo seed users & items
          const cleanedUsers = (parsed.users || []).filter(
            (u: StoredUser) =>
              u.email &&
              !u.email.endsWith('@aurelia.app') &&
              !u.email.endsWith('@aurelia.edu') &&
              u.id !== 'user-1' &&
              u.id !== 'user-2'
          );

          const cleanedSpaces = (parsed.spaces || []).filter(
            (s: Space) => s.id !== 'space-1' && s.id !== 'space-2' && s.id !== 'space-3'
          );

          const cleanedProjects = (parsed.projects || []).filter(
            (p: Project) => p.id !== 'proj-1' && p.id !== 'proj-2' && p.id !== 'proj-3'
          );

          const cleanedMaterials = (parsed.materials || []).filter(
            (m: Material) => m.id !== 'mat-1' && m.id !== 'mat-2' && m.id !== 'mat-3' && m.id !== 'mat-4' && m.projectId !== 'proj-1'
          );

          const cleanedChunks = (parsed.documentChunks || []).filter(
            (c: DocumentChunk) => c.projectId !== 'proj-1' && c.projectId !== 'proj-2'
          );

          const cleanedConcepts = (parsed.concepts || []).filter(
            (c: Concept) => c.projectId !== 'proj-1' && c.projectId !== 'proj-2'
          );

          const cleanedActivities = (parsed.activities || []).filter(
            (a: ActivityItem) => a.userId !== 'user-1' && a.projectId !== 'proj-1' && a.projectId !== 'proj-2'
          );

          return {
            ...initial,
            ...parsed,
            users: cleanedUsers,
            spaces: cleanedSpaces,
            projects: cleanedProjects,
            materials: cleanedMaterials,
            documentChunks: cleanedChunks,
            concepts: cleanedConcepts,
            activities: cleanedActivities,
            learningGoals: {},
            tutorMessages: {},
            quizQuestions: {},
            quizResults: {},
            assessmentSubmissions: {},
            learningContexts: {},
            recommendations: [],
          };
        }
      }
    } catch (e) {
      console.warn('[LocalStorageStore] Could not load state from localStorage, using initial', e);
    }
    return getInitialState();
  }

  private save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.warn('[LocalStorageStore] Could not persist state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public getState(): AppState {
    return this.state;
  }

  public get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  public set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    this.state[key] = value;
    this.save();
  }

  public update<K extends keyof AppState>(key: K, updater: (current: AppState[K]) => AppState[K]): void {
    this.state[key] = updater(this.state[key]);
    this.save();
  }

  public resetToSeed(): void {
    this.state = getInitialState();
    this.save();
  }

  public reset(): void {
    this.resetToSeed();
  }
}

export const appStorage = new LocalStorageStore();
