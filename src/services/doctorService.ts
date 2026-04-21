import apiClient from './apiClient';
import { ApiResponse, PageResponse, DoctorResponse } from '@/types/api';

export const doctorService = {
  async list(page = 0, size = 20): Promise<ApiResponse<PageResponse<DoctorResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<DoctorResponse>>>('/doctors', {
      params: { page, size }
    });
    return response.data;
  }
};
