import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { TutorMessage } from '../types';

export async function fetchTutorMessagesApi(projectId: string): Promise<TutorMessage[]> {
  if (isMockMode) {
    return mockDb.getTutorMessages(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/tutor/messages`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getTutorMessages(projectId);
    }
    throw err;
  }
}

export async function sendTutorMessageApi(
  projectId: string,
  text: string,
  actionType?: string
): Promise<TutorMessage> {
  if (isMockMode) {
    return mockDb.sendTutorMessage(projectId, text, actionType);
  }
  try {
    const response = await apiClient.post(`/projects/${projectId}/tutor/messages`, { text, actionType });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.sendTutorMessage(projectId, text, actionType);
    }
    throw err;
  }
}
