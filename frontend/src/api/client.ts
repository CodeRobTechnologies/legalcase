import api from '../lib/api';

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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
      localStorage.removeItem('access_token');
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
