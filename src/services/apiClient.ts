import axios, { AxiosError, AxiosResponse } from 'axios';
import { store } from '@/state/store';
import { logout } from '@/state/authSlice';
import { triggerGlobalToast } from '@/components/ui/Toast';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const state = store.getState();
  const hospitalId = state.auth.user?.currentHospitalId;
  if (hospitalId) {
    config.headers['X-Hospital-Id'] = hospitalId;
  }

  return config;
});


apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        store.dispatch(logout());
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Trigger global toast for any error
      const apiData = error.response?.data as any;
      const message = apiData?.error?.message || apiData?.message || error.message || 'An unexpected error occurred';
      triggerGlobalToast(message, 'error');

      return Promise.reject(error);
    }
);

export default apiClient;