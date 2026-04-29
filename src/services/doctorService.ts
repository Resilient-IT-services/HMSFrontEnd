import apiClient from './apiClient';
import { ApiResponse, PageResponse, DoctorStaffResponse, DoctorAvailabilityResponse, UserSummaryDTO, DoctorSlotDTO } from '@/types/api';

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

  async listDoctors(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<UserSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<UserSummaryDTO>>>('/doctors', {
      params: { page, size, search }
    });
    return response.data;
  },

  async getAvailability(doctorId: string, date: string): Promise<ApiResponse<DoctorAvailabilityResponse>> {
    const response = await apiClient.get<ApiResponse<DoctorAvailabilityResponse>>(`/doctors/${doctorId}/availability`, {
      params: { date }
    });
    return response.data;
  },

  async getSlots(doctorId: string, date: string): Promise<ApiResponse<DoctorSlotDTO[]>> {
    const response = await apiClient.get<ApiResponse<DoctorSlotDTO[]>>(`/doctors/${doctorId}/slots`, {
      params: { date }
    });
    return response.data;
  }
};
