import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { Recommendation, ActivityItem } from '../types';

export interface ActivityFilterParams {
  userId?: string;
  spaceId?: string;
  projectId?: string;
  activityType?: string;
  period?: string;
}

export async function fetchRecommendationsApi(): Promise<Recommendation[]> {
  if (isMockMode) {
    return mockDb.getRecommendations();
  }
  try {
    const response = await apiClient.get('/recommendations');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getRecommendations();
    }
    throw err;
  }
}

export async function fetchActivitiesApi(params?: ActivityFilterParams): Promise<ActivityItem[]> {
  if (isMockMode) {
    return mockDb.getActivities(params?.projectId);
  }
  try {
    const response = await apiClient.get('/activities', { params });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getActivities(params?.projectId);
    }
    throw err;
  }
}

export async function fetchProjectAnalyticsApi(projectId: string) {
  if (isMockMode) {
    return mockDb.getProjectAnalytics(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/analytics`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getProjectAnalytics(projectId);
    }
    throw err;
  }
}

export async function fetchGlobalAnalyticsApi() {
  if (isMockMode) {
    return mockDb.getGlobalAnalytics();
  }
  try {
    const response = await apiClient.get('/analytics/global');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getGlobalAnalytics();
    }
    throw err;
  }
}
