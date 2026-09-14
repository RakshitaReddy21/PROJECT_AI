import { apiClient, isMockMode } from './client';
import { mockDb } from '../mocks/db';
import { Material } from '../types';

export async function fetchMaterialsApi(projectId: string): Promise<Material[]> {
  if (isMockMode) {
    return mockDb.getMaterials(projectId);
  }
  try {
    const response = await apiClient.get(`/projects/${projectId}/materials`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.getMaterials(projectId);
    }
    throw err;
  }
}

export async function uploadMaterialApi(
  projectId: string,
  file: { name: string; size: number; type: string },
  fileContent?: string
): Promise<Material> {
  if (isMockMode) {
    return mockDb.uploadMaterial(projectId, file, fileContent);
  }
  try {
    const response = await apiClient.post(`/projects/${projectId}/materials`, { file, fileContent });
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.uploadMaterial(projectId, file, fileContent);
    }
    throw err;
  }
}

export async function retryMaterialApi(materialId: string): Promise<Material> {
  if (isMockMode) {
    return mockDb.retryMaterialProcessing(materialId);
  }
  try {
    const response = await apiClient.post(`/materials/${materialId}/retry`);
    return response.data;
  } catch (err: any) {
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error' || !err?.response) {
      return mockDb.retryMaterialProcessing(materialId);
    }
    throw err;
  }
}
