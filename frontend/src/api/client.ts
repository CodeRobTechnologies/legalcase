import api from '../lib/api';
import { getToken, clearSession } from './../lib/auth';

// Attach JWT from sessionStorage on every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config;
});
// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error details:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      url: err.config?.url,
    });

    if (err.response?.status === 401) {
      clearSession();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      // reject with error after handling
      return Promise.reject(err);
    }
    // For other errors, also reject
    return Promise.reject(err);
  }
);

export default api;
