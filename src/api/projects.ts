import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { Project } from '../types';

export async function fetchProjectsApi(spaceId?: string): Promise<Project[]> {
  if (isMockMode) {
    return mockDb.getProjects(spaceId);
  }
  try {
    const response = await apiClient.get('/projects', { params: { spaceId } });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getProjects(spaceId);
    }
    throw err;
  }
}

export async function fetchProjectApi(id: string): Promise<Project | null> {
  if (isMockMode) {
    return mockDb.getProject(id);
  }
  try {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getProject(id);
    }
    throw err;
  }
}

export async function createProjectApi(data: { spaceId: string; title: string; description: string; targetGoal: string }): Promise<Project> {
  if (isMockMode) {
    return mockDb.createProject(data);
  }
  try {
    const response = await apiClient.post('/projects', data);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.createProject(data);
    }
    throw err;
  }
}
