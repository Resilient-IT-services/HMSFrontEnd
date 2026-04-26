import apiClient from './apiClient';
import { ApiResponse, PageResponse, NurseStaffResponse } from '@/types/api';

export const nurseService = {
  async list(
    page = 0, 
    size = 20, 
    name?: string, 
    department?: string
  ): Promise<ApiResponse<PageResponse<NurseStaffResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<NurseStaffResponse>>>('/staff/nurses', {
      params: { page, size, name, department }
    });
    return response.data;
  }
};
