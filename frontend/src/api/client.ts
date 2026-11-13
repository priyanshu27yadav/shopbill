import axios from 'axios';

export const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopbill_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const currentShopId = localStorage.getItem('shopbill_active_shop_id');
  if (currentShopId) {
    config.headers['X-Shop-Id'] = currentShopId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid/expired session
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('shopbill_token');
        localStorage.removeItem('shopbill_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
