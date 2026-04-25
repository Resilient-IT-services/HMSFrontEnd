import apiClient from './apiClient';
import { ApiResponse, PageResponse, DoctorResponse } from '@/types/api';

export const doctorService = {
  async list(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<DoctorResponse>>> {
    // Map to /users?role=DOCTOR as /doctors doesn't exist in backend
    const response = await apiClient.get<ApiResponse<PageResponse<DoctorResponse>>>('/users', {
      params: { page, size, search, role: 'DOCTOR' }
    });
    return response.data;
  }
};
