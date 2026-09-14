import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const isMockMode = import.meta.env.VITE_MOCK_MODE !== 'false';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject stored auth token
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('aurelia_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
