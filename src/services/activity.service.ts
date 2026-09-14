import { ActivityItem } from '../types';
import { appStorage } from './storage/localStorageStore';

import { authService } from './auth.service';

export class ActivityService {
  async getActivities(projectId?: string, userId?: string): Promise<ActivityItem[]> {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const activities = appStorage.get('activities');

    let list = activities;
    if (currentUser?.role !== 'admin' || userId) {
      if (!targetUserId) return [];
      list = activities.filter((a) => a.userId === targetUserId);
    }

    if (projectId) {
      return list.filter((a) => a.projectId === projectId);
    }
    return list;
  }

  async logActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<ActivityItem> {
    const newActivity: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    appStorage.update('activities', (prev) => [newActivity, ...prev]);
    return newActivity;
  }
}

export const activityService = new ActivityService();
