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
    const params: any = { page, size };
    if (name && name.trim()) params.name = name;
    if (department) params.department = department;
    if (specialization) params.specialization = specialization;
    if (minFee !== undefined) params.minFee = minFee;
    if (maxFee !== undefined) params.maxFee = maxFee;

    const response = await apiClient.get<ApiResponse<PageResponse<DoctorStaffResponse>>>('/staff/doctors', {
      params
    });
    return response.data;
  },

  async get(doctorId: string): Promise<ApiResponse<DoctorStaffResponse>> {
    const response = await apiClient.get<ApiResponse<DoctorStaffResponse>>(`/staff/doctors/${doctorId}`);
    return response.data;
  },

  async listDoctors(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<UserSummaryDTO>>> {
    const params: any = { page, size };
    if (search && search.trim()) params.search = search;
    const response = await apiClient.get<ApiResponse<PageResponse<UserSummaryDTO>>>('/doctors', {
      params
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
