import apiClient from './apiClient';
import { ApiResponse, UserResponse, PageResponse, UserRequestDTO, UserSummaryDTO, AdminResetPasswordRequest } from '@/types/api';

export const userService = {
  async listUsers(page = 0, size = 20, search?: string, role?: string, active?: boolean, includeDeleted = false): Promise<ApiResponse<PageResponse<UserSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<UserSummaryDTO>>>('/users', {
      params: { page, size, search, role, active, includeDeleted }
    });
    return response.data;
  },

  async getFullProfile(userId: string): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${userId}/full-profile`);
    return response.data;
  },

  async createUser(data: UserRequestDTO): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/users', data);
    return response.data;
  },

  async updateUser(userId: string, data: UserRequestDTO): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${userId}`, data);
    return response.data;
  },

  async saveUser(data: UserRequestDTO): Promise<ApiResponse<UserResponse>> {
    if (data.id) {
      return this.updateUser(data.id, data);
    }
    return this.createUser(data);
  },

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/users/${userId}`);
    return response.data;
  },

  async resetPassword(userId: string, data: AdminResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/users/${userId}/reset-password`, data);
    return response.data;
  }

};
