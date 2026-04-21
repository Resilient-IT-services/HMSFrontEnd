import apiClient from './apiClient';
import { ApiResponse, PageResponse, AppointmentResponse, CreateAppointmentRequest, UpdateAppointmentStatusRequest } from '@/types/api';

export const appointmentService = {
  async list(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<AppointmentResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', {
      params: { page, size, search }
    });
    return response.data;
  },

  async create(request: CreateAppointmentRequest): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', request);
    return response.data;
  },

  async updateStatus(id: number, request: UpdateAppointmentStatusRequest): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/status`, request);
    return response.data;
  }
};
