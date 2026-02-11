import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (password: string) =>
  api.post<{ token: string }>('/auth/login', { password });

// Games
export const getGames = () => api.get('/games');
export const addGame = (name: string, universeId?: string, iconUrl?: string) =>
  api.post('/games', { name, universeId, iconUrl });
export const deleteGame = (id: string) => api.delete(`/games/${id}`);

// Stats
export const getStatsMeta = () => api.get('/stats/meta');
export const getCategoryStats = (gameId: string, category: string, range: string, interval: string) =>
  api.get(`/stats/${gameId}/${category}`, { params: { range, interval } });
export const getCCU = (gameId: string) =>
  api.get(`/stats/${gameId}/ccu`);
export const getProductBreakdown = (gameId: string, range: string) =>
  api.get(`/stats/${gameId}/product-breakdown`, { params: { range } });
