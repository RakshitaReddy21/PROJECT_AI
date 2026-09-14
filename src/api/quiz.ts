import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { QuizQuestion, QuizResult } from '../types';

export async function fetchQuizQuestionsApi(projectId: string): Promise<QuizQuestion[]> {
  if (isMockMode) {
    return mockDb.getQuizQuestions(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/quiz/questions`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getQuizQuestions(projectId);
    }
    throw err;
  }
}

export async function regenerateQuizApi(projectId: string): Promise<QuizQuestion[]> {
  if (isMockMode) {
    return mockDb.generateQuiz(projectId);
  }
  try {
    const response = await apiClient.post(`/projects/${projectId}/quiz/generate`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.generateQuiz(projectId);
    }
    throw err;
  }
}

export async function submitQuizApi(
  projectId: string,
  attempts: { questionId: string; selectedOptionId: string }[]
): Promise<QuizResult> {
  if (isMockMode) {
    return mockDb.submitQuiz(projectId, attempts);
  }
  try {
    const response = await apiClient.post(`/projects/${projectId}/quiz/submit`, { attempts });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.submitQuiz(projectId, attempts);
    }
    throw err;
  }
}
