import api from '../lib/api';

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
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
      sessionStorage.removeItem('access_token');
      const isLoginPage = window.location.hash.startsWith('#/login') || window.location.pathname.startsWith('/login');
      if (!isLoginPage) {
        window.location.href = '/#/login';
      }
      // reject with error after handling
      return Promise.reject(err);
    }
    // For other errors, also reject
    return Promise.reject(err);
  }
);

export default api;
