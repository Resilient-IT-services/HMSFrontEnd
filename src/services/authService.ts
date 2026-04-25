import apiClient from './apiClient';
import { ApiResponse, UserProfileResponse } from '@/types/api';

export const authService = {
  async login(username: string, password: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/logout');
    return response.data;
  },

  async me(): Promise<ApiResponse<UserProfileResponse>> {
    const response = await apiClient.get<ApiResponse<UserProfileResponse>>('/auth/me');
    return response.data;
  },
};
