import apiClient from './apiClient';
import { ApiResponse } from '@/types/api';

export const catalogService = {
  async getDepartments(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>('/departments');
    return response.data;
  },

  async getSpecializations(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<ApiResponse<string[]>>('/specializations');
    return response.data;
  }
};
