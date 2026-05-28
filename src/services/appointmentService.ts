import { AxiosRequestConfig } from 'axios';
import apiClient from './apiClient';
import { ApiResponse, PageResponse, AppointmentResponse, AppointmentSummaryDTO, CreateAppointmentRequest, UpdateAppointmentStatusRequest, AppointmentStatus, VitalsDTO, AppointmentStatsDTO, OPDEncounterRequest } from '@/types/api';

export interface AppointmentListParams {
  page?: number;
  size?: number;
  search?: string;
  from?: string;
  to?: string;
  doctorId?: string;
  doctorName?: string;
  patientId?: string;
  patientCode?: string;
  status?: string;
  paymentStatus?: string;
  vitalsStatus?: string;
  tokenNumber?: string;
  timeSlot?: string;
}

export const appointmentService = {
  async list(params: AppointmentListParams = {}): Promise<ApiResponse<PageResponse<AppointmentResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>('/appointments', {
      params: { 
        page: 0, 
        size: 20, 
        ...params 
      }
    });
    return response.data;
  },

  async listSummary(params: AppointmentListParams = {}): Promise<ApiResponse<PageResponse<AppointmentSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentSummaryDTO>>>('/appointments/summary', {
      params: { 
        page: 0, 
        size: 20, 
        ...params 
      }
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

  async create(request: CreateAppointmentRequest, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', request, config);
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

  async bookConsultation(request: OPDEncounterRequest, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>('/appointments/book-consultation', request, config);
    return response.data;
  },

  async updateStatus(appointmentId: string, request: UpdateAppointmentStatusRequest, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${appointmentId}/status`, request, config);
    return response.data;
  },

  async completeConsultation(appointmentId: string, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.put<ApiResponse<AppointmentResponse>>(`/appointments/${appointmentId}/complete`, undefined, config);
    return response.data;
  },

  async startNextConsultation(doctorId: string, config?: AxiosRequestConfig): Promise<ApiResponse<AppointmentResponse>> {
    const response = await apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/start-next/${doctorId}`, undefined, config);
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

  async getStats(from?: string, to?: string): Promise<ApiResponse<AppointmentStatsDTO>> {
    const response = await apiClient.get<ApiResponse<AppointmentStatsDTO>>('/appointments/stats', {
      params: { from, to }
    });
    return response.data;
  }
};
