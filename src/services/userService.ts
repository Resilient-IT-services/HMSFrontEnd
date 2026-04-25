import apiClient from './apiClient';
import { ApiResponse, UserResponse, PageResponse, UserRequestDTO } from '@/types/api';

export const userService = {
  async listUsers(page = 0, size = 20, search?: string, role?: string, active?: boolean, includeDeleted = false): Promise<ApiResponse<PageResponse<UserResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>('/users', {
      params: { page, size, search, role, active, includeDeleted }
    });
    return response.data;
  },

  async getUser(id: string): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`);
    return response.data;
  },

  async getFullProfile(id: string): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${id}/full-profile`);
    return response.data;
  },

  async createUser(data: UserRequestDTO): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: Partial<UserRequestDTO>): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
    return response.data;
  },

  async save(data: UserRequestDTO): Promise<ApiResponse<UserResponse>> {
    if (data.id) {
      return this.updateUser(data.id, data);
    }
    return this.createUser(data);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  }
};
