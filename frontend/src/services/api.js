import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s for PDF generation
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drt_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('drt_admin_token');
      const base = import.meta.env.PROD ? '/form' : '';
      if (window.location.pathname.startsWith(`${base}/admin`) && window.location.pathname !== `${base}/admin/login`) {
        window.location.href = `${base}/admin/login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
