import apiClient from './apiClient';
import { ApiResponse, UserProfile } from '@/types/api';

export const authService = {
  async login(username: string, password: string): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.post<ApiResponse<UserProfile>>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  async me(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data;
  },
};
