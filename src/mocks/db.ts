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
} from '../types';
import { authService } from '../services/auth.service';
import { spacesService } from '../services/spaces.service';
import { projectsService } from '../services/projects.service';
import { materialsService } from '../services/materials.service';
import { tutorService } from '../services/tutor.service';
import { quizService } from '../services/quiz.service';
import { assessmentService } from '../services/assessment.service';
import { masteryService } from '../services/mastery.service';
import { recommendationService } from '../services/recommendation.service';
import { activityService } from '../services/activity.service';
import { aiUsageService } from '../services/aiUsage.service';
import { adminService } from '../services/admin.service';
import { analyticsService } from '../services/analytics.service';

class MockDatabaseAdapter {
  // Auth
  async login(email: string, password?: string, forcedRole?: 'admin' | 'learner'): Promise<{ user: User; token: string }> {
    return authService.login(email, password, forcedRole);
  }

  async register(name: string, email: string, password?: string): Promise<{ user: User; token: string }> {
    return authService.register({ name, email, password });
  }

  // Spaces
  async getSpaces(): Promise<Space[]> {
    return spacesService.getSpaces();
  }

  async getSpace(id: string): Promise<Space | null> {
    return spacesService.getSpace(id);
  }

  async createSpace(data: { name: string; description: string; color?: string; icon?: string }): Promise<Space> {
    return spacesService.createSpace(data);
  }

  // Projects
  async getProjects(spaceId?: string): Promise<Project[]> {
    return projectsService.getProjects(spaceId);
  }

  async getProject(id: string): Promise<Project | null> {
    return projectsService.getProject(id);
  }

  async createProject(data: { spaceId: string; title: string; description: string; targetGoal: string }): Promise<Project> {
    return projectsService.createProject(data);
  }

  // Materials
  async getMaterials(projectId: string): Promise<Material[]> {
    return materialsService.getMaterials(projectId);
  }

  async uploadMaterial(projectId: string, file: { name: string; size: number; type: string }, fileContent?: string): Promise<Material> {
    return materialsService.uploadMaterial(projectId, file, fileContent);
  }

  async retryMaterialProcessing(materialId: string): Promise<Material> {
    return materialsService.retryMaterial(materialId);
  }

  // Concepts
  async getConcepts(projectId: string): Promise<Concept[]> {
    return masteryService.getConcepts(projectId);
  }

  // Tutor
  async getTutorMessages(projectId: string): Promise<TutorMessage[]> {
    return tutorService.getTutorMessages(projectId);
  }

  async sendTutorMessage(projectId: string, userText: string, actionType?: string): Promise<TutorMessage> {
    return tutorService.sendTutorMessage(projectId, userText, actionType);
  }

  // Quiz
  async getQuizQuestions(projectId: string): Promise<QuizQuestion[]> {
    return quizService.getQuizQuestions(projectId);
  }

  async generateQuiz(projectId: string): Promise<QuizQuestion[]> {
    return quizService.generateQuiz(projectId);
  }

  async submitQuiz(projectId: string, attempts: { questionId: string; selectedOptionId: string }[]): Promise<QuizResult> {
    return quizService.submitQuiz(projectId, attempts);
  }

  // Assessment
  async getAssessment(projectId: string): Promise<AssessmentSubmission | null> {
    return assessmentService.getAssessment(projectId);
  }

  async submitAssessment(projectId: string, prompt: string, responseText: string): Promise<AssessmentSubmission> {
    return assessmentService.submitAssessment(projectId, prompt, responseText);
  }

  // Recommendations & Activity
  async getRecommendations(): Promise<Recommendation[]> {
    return recommendationService.getRecommendations();
  }

  async getActivities(projectId?: string): Promise<ActivityItem[]> {
    return activityService.getActivities(projectId);
  }

  // Admin & Observability
  async getAIUsage(): Promise<AIUsageMetrics[]> {
    return aiUsageService.getAIUsage();
  }

  async getAIEvaluation(): Promise<AIEvaluationMetrics> {
    return aiUsageService.getAIEvaluation();
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return aiUsageService.getSystemHealth();
  }

  async getUsers(): Promise<User[]> {
    return adminService.getUsers();
  }

  async getUserDetail(userId: string): Promise<User | null> {
    return adminService.getUserDetail(userId);
  }

  // Analytics
  async getProjectAnalytics(projectId: string) {
    return analyticsService.getProjectAnalytics(projectId);
  }

  async getGlobalAnalytics() {
    return analyticsService.getGlobalAnalytics();
  }
}

export const mockDb = new MockDatabaseAdapter();
