import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { User } from '../types';

export async function loginApi(email: string, password?: string, forcedRole?: 'admin' | 'learner'): Promise<{ user: User; token: string }> {
  if (isMockMode) {
    return mockDb.login(email, password, forcedRole);
  }
  try {
    const response = await apiClient.post('/auth/login', { email, password, forcedRole });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.login(email, password, forcedRole);
    }
    throw err;
  }
}

export async function registerApi(name: string, email: string, password?: string): Promise<{ user: User; token: string }> {
  if (isMockMode) {
    return mockDb.register(name, email, password);
  }
  try {
    const response = await apiClient.post('/auth/register', { name, email, password });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.register(name, email, password);
    }
    throw err;
  }
}


