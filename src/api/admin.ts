import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { AIUsageMetrics, AIEvaluationMetrics, SystemHealth, User } from '../types';

export async function fetchAIUsageApi(): Promise<AIUsageMetrics[]> {
  if (isMockMode) {
    return mockDb.getAIUsage();
  }
  try {
    const response = await apiClient.get('/admin/ai-usage');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getAIUsage();
    }
    throw err;
  }
}

export async function fetchAIEvaluationApi(): Promise<AIEvaluationMetrics> {
  if (isMockMode) {
    return mockDb.getAIEvaluation();
  }
  try {
    const response = await apiClient.get('/admin/ai-evaluation');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getAIEvaluation();
    }
    throw err;
  }
}

export async function fetchSystemHealthApi(): Promise<SystemHealth> {
  if (isMockMode) {
    return mockDb.getSystemHealth();
  }
  try {
    const response = await apiClient.get('/admin/system-health');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getSystemHealth();
    }
    throw err;
  }
}

export async function fetchUsersApi(): Promise<User[]> {
  if (isMockMode) {
    return mockDb.getUsers();
  }
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getUsers();
    }
    throw err;
  }
}

export async function fetchUserDetailApi(userId: string): Promise<User | null> {
  if (isMockMode) {
    return mockDb.getUserDetail(userId);
  }
  try {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getUserDetail(userId);
    }
    throw err;
  }
}
