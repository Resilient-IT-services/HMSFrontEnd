import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types/api';
import { store } from '@/state/store';
import { logout } from '@/state/authSlice';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Dispatched from here to keep state in sync
      store.dispatch(logout());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
