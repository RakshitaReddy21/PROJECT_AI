import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { Space } from '../types';

export async function fetchSpacesApi(): Promise<Space[]> {
  if (isMockMode) {
    return mockDb.getSpaces();
  }
  try {
    const response = await apiClient.get('/spaces');
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getSpaces();
    }
    throw err;
  }
}

export async function fetchSpaceApi(id: string): Promise<Space | null> {
  if (isMockMode) {
    return mockDb.getSpace(id);
  }
  try {
    const response = await apiClient.get(`/spaces/${id}`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getSpace(id);
    }
    throw err;
  }
}

export async function createSpaceApi(data: { name: string; description: string; color?: string; icon?: string }): Promise<Space> {
  if (isMockMode) {
    return mockDb.createSpace(data);
  }
  try {
    const response = await apiClient.post('/spaces', data);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.createSpace(data);
    }
    throw err;
  }
}
