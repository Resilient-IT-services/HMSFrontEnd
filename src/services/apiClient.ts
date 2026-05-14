import axios, { AxiosError, AxiosResponse } from 'axios';
import { store } from '@/state/store';
import { logout } from '@/state/authSlice';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
    skipHospitalHeader?: boolean;
  }
}

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to trigger toasts without importing UI components (avoids circular dependency)
const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  if (globalThis.window !== undefined) {
    globalThis.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
};


apiClient.interceptors.request.use((config) => {
  const token = globalThis.window === undefined ? null : localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const state = store.getState();
  const hospitalId = state.auth.user?.currentHospitalId;
  if (hospitalId && !config.skipHospitalHeader) {
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
        // We use window.location.href here as a last resort for unauthorized access from non-component files
        if (globalThis.window !== undefined && globalThis.location.pathname !== '/login') {
          globalThis.location.href = '/login';
        }
      }

      // Trigger global toast for any error unless skipToast is set
      if (!error.config?.skipToast) {
        const apiData = error.response?.data as any;
        const message = apiData?.error?.message || apiData?.message || error.message || 'Something went wrong. Please try again.';
        
        // Use a more user-friendly type for validation errors (400)
        const type = error.response?.status === 400 ? 'warning' : 'error';
        triggerToast(message, type);
      }

      return Promise.reject(error);
    }
);

export default apiClient;
