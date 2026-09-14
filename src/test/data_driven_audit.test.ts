import { describe, it, expect, beforeEach } from 'vitest';
import { calculateStreak, calculateStudyHours, formatRelativeTime, calculateWeeklyIntensity } from '../utils/date';
import { analyticsService } from '../services/analytics.service';
import { authService } from '../services/auth.service';
import { quizService } from '../services/quiz.service';
import { projectsService } from '../services/projects.service';
import { activityService } from '../services/activity.service';
import { appStorage } from '../services/storage/localStorageStore';
import { ActivityItem } from '../types';

describe('Data-Driven Audit & Hardcoded Value Elimination (Phase 3.5)', () => {
  beforeEach(() => {
    // Ensure clean storage baseline
    appStorage.reset();
  });

  describe('Date & Relative Time Utilities', () => {
    it('returns "Not studied yet" for null or undefined dates', () => {
      expect(formatRelativeTime(null)).toBe('Not studied yet');
      expect(formatRelativeTime(undefined)).toBe('Not studied yet');
      expect(formatRelativeTime('')).toBe('Not studied yet');
    });

    it('formats "Just now" for dates within the last 60 seconds', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('Just now');
    });

    it('formats relative minutes and hours', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinutesAgo)).toBe('10m ago');

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });
  });

  describe('Streak Calculation Engine', () => {
    it('returns 0 for empty activities list (honest empty state)', () => {
      expect(calculateStreak([])).toBe(0);
    });

    it('calculates 1 day streak for today activity', () => {
      const today = new Date().toISOString();
      const activities: ActivityItem[] = [
        {
          id: 'act-1',
          userId: 'user-1',
          userName: 'Tester',
          type: 'quiz_completed',
          description: 'Quiz',
          timestamp: today,
        },
      ];
      expect(calculateStreak(activities)).toBe(1);
    });

    it('calculates consecutive days accurately', () => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)).toISOString();
      const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 12, 0, 0)).toISOString();
      const twoDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2, 12, 0, 0)).toISOString();

      const activities: ActivityItem[] = [
        { id: '1', userId: 'u1', userName: 'Tester', type: 'quiz_completed', description: 'Quiz 1', timestamp: today },
        { id: '2', userId: 'u1', userName: 'Tester', type: 'tutor_queried', description: 'Tutor 2', timestamp: yesterday },
        { id: '3', userId: 'u1', userName: 'Tester', type: 'material_uploaded', description: 'Mat 3', timestamp: twoDaysAgo },
      ];
      expect(calculateStreak(activities)).toBe(3);
    });

    it('breaks streak when a gap day exists', () => {
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)).toISOString();
      const threeDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3, 12, 0, 0)).toISOString();

      const activities: ActivityItem[] = [
        { id: '1', userId: 'u1', userName: 'Tester', type: 'quiz_completed', description: 'Quiz 1', timestamp: today },
        { id: '2', userId: 'u1', userName: 'Tester', type: 'tutor_queried', description: 'Tutor 2', timestamp: threeDaysAgo },
      ];
      expect(calculateStreak(activities)).toBe(1);
    });
  });

  describe('Study Hours & Intensity Calculation', () => {
    it('returns 0.0 study hours for zero activities', () => {
      expect(calculateStudyHours([])).toBe(0.0);
    });

    it('weights activities accurately based on cognitive intensity', () => {
      const activities: ActivityItem[] = [
        { id: '1', userId: 'u1', userName: 'T', type: 'quiz_completed', description: 'Quiz', timestamp: new Date().toISOString() }, // 15 mins
        { id: '2', userId: 'u1', userName: 'T', type: 'assessment_submitted', description: 'Essay', timestamp: new Date().toISOString() }, // 25 mins
        { id: '3', userId: 'u1', userName: 'T', type: 'tutor_queried', description: 'Tutor', timestamp: new Date().toISOString() }, // 6 mins
      ];
      // Total: 46 mins -> 46 / 60 = 0.766... -> rounded to 0.8 hours
      expect(calculateStudyHours(activities)).toBe(0.8);
    });

    it('calculates 7-day weekly intensity bars dynamically', () => {
      const intensity = calculateWeeklyIntensity([]);
      expect(intensity).toHaveLength(7);
      expect(intensity[0].day).toBe('Mon');
      expect(intensity[6].day).toBe('Sun');
      expect(intensity.every((item) => item.count === 0)).toBe(true);
    });
  });

  describe('Dynamic Global & Project Analytics Services', () => {
    it('returns honest empty state metrics when no data exists', async () => {
      // Simulate empty application state
      appStorage.set('spaces', []);
      appStorage.set('projects', []);
      appStorage.set('concepts', []);
      appStorage.set('materials', []);
      appStorage.set('activities', []);
      appStorage.set('quizResults', {});

      const globalData = await analyticsService.getGlobalAnalytics();
      expect(globalData.totalSpaces).toBe(0);
      expect(globalData.totalProjects).toBe(0);
      expect(globalData.totalConcepts).toBe(0);
      expect(globalData.totalMaterials).toBe(0);
      expect(globalData.averageMastery).toBe(0);
      expect(globalData.activeStreakDays).toBe(0);
      expect(globalData.hoursLearned).toBe(0.0);
      expect(globalData.totalQuestionsAnswered).toBe(0);
      expect(globalData.quizzesPassed).toBe(0);
      expect(globalData.masteryGain).toBe(0);
    });

    it('calculates project analytics dynamically without fabricated constants', async () => {
      const projectAnalytics = await analyticsService.getProjectAnalytics('proj-1');
      expect(projectAnalytics.projectId).toBe('proj-1');
      expect(projectAnalytics.overallMastery).toBe(76);
      expect(projectAnalytics.totalConcepts).toBe(6);
      expect(projectAnalytics.materialsCount).toBe(4);
      expect(typeof projectAnalytics.masteryGain).toBe('number');
    });
  });

  describe('User Identity & Project Isolation in Activity Logging', () => {
    it('logs activities with the logged-in user identity instead of hardcoded Alex Rivera', async () => {
      // Register new user
      const { user } = await authService.register({
        name: 'Dr. Evelyn Vance',
        email: 'evelyn@university.edu',
      });

      // Save user to session storage simulation
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('aurelia_auth_user', JSON.stringify(user));
      }

      // Create a new project under space-1
      const newProj = await projectsService.createProject({
        spaceId: 'space-1',
        title: 'Quantum Computing Foundations',
        description: 'Qubits, superposition, and quantum entanglement',
        targetGoal: 'Understand quantum circuit design',
      });

      // Retrieve recent activity
      const activities = await activityService.getActivities();
      const creationActivity = activities.find((a) => a.projectId === newProj.id);

      expect(creationActivity).toBeDefined();
      expect(creationActivity?.userName).toBe('Dr. Evelyn Vance');
      expect(creationActivity?.userId).toBe(user.id);
    });

    it('does not leak proj-1 quiz questions into newly created projects', async () => {
      const brandNewProjectId = 'proj-brand-new';
      const questions = await quizService.getQuizQuestions(brandNewProjectId);
      // Since concepts are empty for this project, it must return an honest empty list
      expect(questions).toEqual([]);
    });
  });
});
