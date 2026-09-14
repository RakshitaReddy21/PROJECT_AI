import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { Concept, GrowthInsight } from '../types';
import { growthService } from '../services/growth.service';

export async function fetchConceptsApi(projectId: string): Promise<Concept[]> {
  if (isMockMode) {
    return mockDb.getConcepts(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/concepts`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getConcepts(projectId);
    }
    throw err;
  }
}

export async function fetchGrowthInsightApi(projectId: string): Promise<GrowthInsight> {
  if (isMockMode) {
    return growthService.getGrowthInsight(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/growth`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return growthService.getGrowthInsight(projectId);
    }
    throw err;
  }
}
