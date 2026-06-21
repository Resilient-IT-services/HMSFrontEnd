import apiClient from './apiClient';
import { ApiResponse, PageResponse, DoctorStaffResponse, DoctorAvailabilityResponse, UserSummaryDTO, DoctorSlotDTO, DoctorSelectionDTO, DoctorRevenueSummaryDTO } from '@/types/api';

export const doctorService = {
  async list(params: {
    page?: number;
    size?: number;
    name?: string;
    department?: string;
    specialization?: string;
    minFee?: number;
    maxFee?: number;
    sort?: string;
  } = {}): Promise<ApiResponse<PageResponse<DoctorStaffResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<DoctorStaffResponse>>>('/staff/doctors', {
      params: { page: 0, size: 20, ...params }
    });
    return response.data;
  },

  async get(doctorId: string): Promise<ApiResponse<DoctorStaffResponse>> {
    const response = await apiClient.get<ApiResponse<DoctorStaffResponse>>(`/staff/doctors/${doctorId}`);
    return response.data;
  },

  async getDoctorsSelection(): Promise<ApiResponse<DoctorSelectionDTO[]>> {
    const response = await apiClient.get<ApiResponse<DoctorSelectionDTO[]>>('/staff/doctors/selection');
    return response.data;
  },

  async getRevenueSummary(doctorId: string, from?: string, to?: string): Promise<ApiResponse<DoctorRevenueSummaryDTO>> {
    const response = await apiClient.get<ApiResponse<DoctorRevenueSummaryDTO>>(`/doctors/${doctorId}/revenue-summary`, {
      params: { from, to }
    });
    return response.data;
  },

  async listDoctors(params: { page?: number; size?: number; search?: string; sort?: string } = {}): Promise<ApiResponse<PageResponse<UserSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<UserSummaryDTO>>>('/doctors', {
      params: { page: 0, size: 20, ...params }
    });
    return response.data;
  },

  async getAvailability(doctorId: string, date: string): Promise<ApiResponse<DoctorAvailabilityResponse>> {
    const selectedDate = date?.split('T')[0];
    const response = await apiClient.get<ApiResponse<DoctorAvailabilityResponse>>(`/doctors/${doctorId}/availability`, {
      params: { date: selectedDate }
    });
    return response.data;
  },

  async getSlots(doctorId: string, date: string): Promise<ApiResponse<DoctorSlotDTO[]>> {
    const selectedDate = date?.split('T')[0];
    const response = await apiClient.get<ApiResponse<DoctorSlotDTO[]>>(`/doctors/${doctorId}/slots`, {
      params: { date: selectedDate }
    });
    return response.data;
  }
};
