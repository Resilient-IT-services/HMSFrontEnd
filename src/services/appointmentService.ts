import { AxiosRequestConfig } from 'axios';
import apiClient from './apiClient';
import { ApiResponse, PageResponse, AppointmentResponse, CreateAppointmentRequest, UpdateAppointmentStatusRequest, AppointmentStatus, VitalsDTO, AppointmentStatsDTO } from '@/types/api';

export const appointmentService = {
  async list(page = 0, size = 20, search?: string, date?: string): Promise<ApiResponse<PageResponse<AppointmentResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', {
      params: { page, size, search, date }
    });
    return response.data;
  },

  async listByStatus(status: AppointmentStatus): Promise<ApiResponse<PageResponse<AppointmentResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', {
      params: { status }
    });
    return response.data;
  },

  async get(id: string): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.get<ApiResponse<AppointmentResponse>>(`/appointments/${id}`);
    return response.data;
  },

  async create(request: CreateAppointmentRequest): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', request);
    return response.data;
  },

  async update(id: string, request: Partial<CreateAppointmentRequest>, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}`, request, config);
    return response.data;
  },

  async save(data: CreateAppointmentRequest, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    if (data.id) {
      return this.update(data.id, data, config);
    }
    return this.create(data);
  },

  async updateStatus(appointmentId: string, request: UpdateAppointmentStatusRequest, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${appointmentId}/status`, request, config);
    return response.data;
  },

  async patchVitals(appointmentId: string, vitals: VitalsDTO, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.patch<ApiResponse<AppointmentResponse>>(`/appointments/${appointmentId}/vitals`, vitals, config);
    return response.data;
  },

  async updateConsultation(appointmentId: string, request: Partial<AppointmentResponse>): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.patch<ApiResponse<AppointmentResponse>>(`/appointments/${appointmentId}/consultation`, request);
    return response.data;
  },

  async getStats(date: string): Promise<ApiResponse<AppointmentStatsDTO>> {
    const response = await apiClient.get<ApiResponse<AppointmentStatsDTO>>('/appointments/stats', {
      params: { date }
    });
    return response.data;
  }
};
