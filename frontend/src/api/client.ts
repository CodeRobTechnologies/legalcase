import axios from 'axios';
import { getToken, clearSession } from '../lib/auth';

const rawUrl = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawUrl
  ? (rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl)
  : (import.meta.env.DEV ? 'http://127.0.0.1:5000' : '');

const apiBaseUrl = BASE_URL.replace(/\/$/, '');

if (!apiBaseUrl) {
  console.warn(
    '[LegalCase API] Warning: VITE_API_URL is empty or undefined. ' +
    'API calls will fall back to relative path (current origin), which may return 404s if the backend is hosted elsewhere.'
  );
} else {
  console.log(`[LegalCase API] Configured with Base URL: ${apiBaseUrl}`);
}

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
  withCredentials: true,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log(`[API Request] ${config.method?.toUpperCase()} -> ${config.baseURL || ''}${config.url}`);

  return config;
});

// Redirect to login on 401, and print detailed responses/errors
api.interceptors.response.use(
  (res) => {
    console.log(`[API Response Success] ${res.config.method?.toUpperCase()} -> ${res.config.url}`, res.status);
    return res;
  },
  (err) => {
    console.error('[API Response Error]', {
      url: err.config?.url,
      method: err.config?.method?.toUpperCase(),
      status: err.response?.status,
      message: err.message,
      data: err.response?.data
    });

    if (err.response?.status === 401) {
      clearSession();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
