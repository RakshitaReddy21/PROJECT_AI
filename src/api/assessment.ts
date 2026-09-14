import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { AssessmentSubmission } from '../types';

export async function fetchAssessmentApi(projectId: string): Promise<AssessmentSubmission | null> {
  if (isMockMode) {
    return mockDb.getAssessment(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/assessment`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getAssessment(projectId);
    }
    throw err;
  }
}

export async function submitAssessmentApi(
  projectId: string,
  prompt: string,
  responseText: string
): Promise<AssessmentSubmission> {
  if (isMockMode) {
    return mockDb.submitAssessment(projectId, prompt, responseText);
  }
  try {
    const response = await apiClient.post(`/projects/${projectId}/assessment`, { prompt, responseText });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.submitAssessment(projectId, prompt, responseText);
    }
    throw err;
  }
}
