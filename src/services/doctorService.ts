import apiClient from './apiClient';
import { ApiResponse, PageResponse, DoctorStaffResponse, DoctorAvailabilityResponse } from '@/types/api';

export const doctorService = {
  async list(
    page = 0, 
    size = 20, 
    name?: string, 
    department?: string, 
    specialization?: string,
    minFee?: number,
    maxFee?: number
  ): Promise<ApiResponse<PageResponse<DoctorStaffResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<DoctorStaffResponse>>>('/staff/doctors', {
      params: { page, size, name, department, specialization, minFee, maxFee }
    });
    return response.data;
  },

  async getAvailability(doctorId: string, date: string): Promise<ApiResponse<DoctorAvailabilityResponse>> {
    const response = await apiClient.get<ApiResponse<DoctorAvailabilityResponse>>(`/doctors/${doctorId}/availability`, {
      params: { date }
    });
    return response.data;
  }
};
