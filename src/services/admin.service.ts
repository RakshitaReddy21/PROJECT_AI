import { User, BackgroundJob, SystemHealth, AIEvaluationMetrics, AIUsageMetrics } from '../types';
import { appStorage } from './storage/localStorageStore';
import { authService } from './auth.service';

export class AdminService {
  private assertAdmin(): User {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Administrative access required');
    }
    return currentUser;
  }

  async getUsers(): Promise<User[]> {
    this.assertAdmin();
    return appStorage.get('users');
  }

  async getUserDetail(userId: string): Promise<User | null> {
    this.assertAdmin();
    const users = appStorage.get('users');
    return users.find((u) => u.id === userId) || null;
  }

  async getBackgroundJobs(): Promise<BackgroundJob[]> {
    this.assertAdmin();
    return appStorage.get('backgroundJobs');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    this.assertAdmin();
    return appStorage.get('systemHealth');
  }

  async getAIEvaluation(): Promise<AIEvaluationMetrics> {
    this.assertAdmin();
    return appStorage.get('aiEvaluation');
  }

  async getAIUsage(): Promise<AIUsageMetrics[]> {
    this.assertAdmin();
    return appStorage.get('aiUsage');
  }
}

export const adminService = new AdminService();
