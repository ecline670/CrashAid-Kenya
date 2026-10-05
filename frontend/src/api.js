import axios from 'axios';

export const ORIGIN = import.meta.env.VITE_API_ORIGIN || '';
const api = axios.create({ baseURL: `${ORIGIN}/api` });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) {
    localStorage.clear();
    location.href = '/login';
  }
  return Promise.reject(e);
});
export const errMsg = (e) => e.response?.data?.error || e.message;
export default api;
