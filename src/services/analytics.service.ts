import { appStorage } from './storage/localStorageStore';
import { calculateStreak, calculateStudyHours, calculateWeeklyIntensity } from '../utils/date';
import { projectsService } from './projects.service';
import { authService } from './auth.service';

export interface ProjectAnalyticsData {
  projectId: string;
  projectTitle: string;
  overallMastery: number;
  totalConcepts: number;
  masteredCount: number;
  weakCount: number;
  quizCount: number;
  averageQuizScore: number;
  questionsAttempted: number;
  assessmentCount: number;
  averageAssessmentScore: number;
  tutorQueriesCount: number;
  totalInteractions: number;
  materialsCount: number;
  masteryGain: number;
}

export interface GlobalAnalyticsData {
  totalSpaces: number;
  totalProjects: number;
  totalConcepts: number;
  totalMaterials: number;
  averageMastery: number;
  totalActivities: number;
  activeStreakDays: number;
  hoursLearned: number;
  totalQuestionsAnswered: number;
  quizzesPassed: number;
  conceptsMastered: number;
  masteryGain: number;
  learningVelocityPercent: number;
  weeklyIntensity: { day: string; count: number; heightPercent: number; title: string }[];
}

export class AnalyticsService {
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsData> {
    const project = projectsService.assertProjectAccess(projectId);
    const concepts = appStorage.get('concepts').filter((c) => c.projectId === projectId);
    const quizzes = appStorage.get('quizResults')[projectId] || [];
    const assessments = appStorage.get('assessmentSubmissions')[projectId] || [];
    const activities = appStorage.get('activities').filter((a) => a.projectId === projectId);
    const materials = appStorage.get('materials').filter((m) => m.projectId === projectId);

    const avgQuizScore =
      quizzes.length > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
        : 0;

    const questionsAttempted = quizzes.reduce((sum, q) => sum + q.totalQuestions, 0);

    const avgAssessmentScore =
      assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length)
        : 0;

    const tutorQueriesCount = activities.filter((a) => a.type === 'tutor_queried').length;

    const masteredCount = concepts.filter((c) => c.score >= 80).length;
    const weakCount = concepts.filter((c) => c.score < 65 || c.isWeakness).length;

    const totalRecentChange = concepts.reduce((sum, c) => sum + (c.recentChange || 0), 0);
    const masteryGain = concepts.length > 0 ? Math.max(0, Math.round(totalRecentChange / concepts.length)) : 0;

    return {
      projectId,
      projectTitle: project.title,
      overallMastery: project.masteryScore,
      totalConcepts: concepts.length,
      masteredCount,
      weakCount,
      quizCount: quizzes.length,
      averageQuizScore: avgQuizScore,
      questionsAttempted,
      assessmentCount: assessments.length,
      averageAssessmentScore: avgAssessmentScore,
      tutorQueriesCount,
      totalInteractions: activities.length,
      materialsCount: materials.length,
      masteryGain,
    };
  }

  async getGlobalAnalytics(userId?: string): Promise<GlobalAnalyticsData> {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;

    let spaces = appStorage.get('spaces');
    let projects = appStorage.get('projects');
    let activities = appStorage.get('activities');

    // Filter by user if not admin overview
    if (currentUser?.role !== 'admin' || userId) {
      if (!targetUserId) {
        spaces = [];
        projects = [];
        activities = [];
      } else {
        spaces = spaces.filter((s) => s.userId === targetUserId);
        projects = projects.filter((p) => p.userId === targetUserId);
        activities = activities.filter((a) => a.userId === targetUserId);
      }
    }

    const projectIds = new Set(projects.map((p) => p.id));
    const concepts = appStorage.get('concepts').filter((c) => projectIds.has(c.projectId));
    const materials = appStorage.get('materials').filter((m) => projectIds.has(m.projectId));
    const quizMap = appStorage.get('quizResults');

    const totalMastery =
      projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + p.masteryScore, 0) / projects.length)
        : 0;

    // Aggregate quizzes for projects owned by this user
    let totalQuestionsAnswered = 0;
    let quizzesPassed = 0;
    projects.forEach((p) => {
      const list = quizMap[p.id] || [];
      list.forEach((q) => {
        totalQuestionsAnswered += q.totalQuestions;
        if (q.score >= 70) quizzesPassed += 1;
      });
    });

    const conceptsMastered = concepts.filter((c) => c.score >= 80).length;

    // Dynamic streak & study hours
    const activeStreakDays = calculateStreak(activities);
    const hoursLearned = calculateStudyHours(activities);
    const weeklyIntensity = calculateWeeklyIntensity(activities);

    // Calculate global net mastery gain
    const totalRecentGain = concepts.reduce((sum, c) => sum + (c.recentChange || 0), 0);
    const masteryGain = concepts.length > 0 ? Math.max(0, Math.round(totalRecentGain / concepts.length)) : 0;

    const learningVelocityPercent = activities.length > 0 ? Math.min(30, Math.max(8, activities.length * 2)) : 0;

    return {
      totalSpaces: spaces.length,
      totalProjects: projects.length,
      totalConcepts: concepts.length,
      totalMaterials: materials.length,
      averageMastery: totalMastery,
      totalActivities: activities.length,
      activeStreakDays,
      hoursLearned,
      totalQuestionsAnswered,
      quizzesPassed,
      conceptsMastered,
      masteryGain,
      learningVelocityPercent,
      weeklyIntensity,
    };
  }
}

export const analyticsService = new AnalyticsService();
