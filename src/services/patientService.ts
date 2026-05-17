import apiClient from './apiClient';
import { ApiResponse, PageResponse, PatientResponse, PatientSummaryDTO, CreatePatientRequest, PrescriptionDTO, PatientHistoryDTO, PatientHistorySummaryDTO, PatientDashboardStatsDTO } from '@/types/api';

export const patientService = {
  async list(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<PatientResponse>>> {
    const params: any = { page, size };
    if (search && search.trim()) params.search = search;
    const response = await apiClient.get<ApiResponse<PageResponse<PatientResponse>>>('/patients', {
      params
    });
    return response.data;
  },

  async listSummary(page = 0, size = 20, search?: string): Promise<ApiResponse<PageResponse<PatientSummaryDTO>>> {
    const params: any = { page, size };
    if (search && search.trim()) params.search = search;
    const response = await apiClient.get<ApiResponse<PageResponse<PatientSummaryDTO>>>('/patients/summary', {
      params
    });
    return response.data;
  },

  async getDashboardStats(): Promise<ApiResponse<PatientDashboardStatsDTO>> {
    const response = await apiClient.get<ApiResponse<PatientDashboardStatsDTO>>('/patients/dashboard-stats');
    return response.data;
  },

  async get(patientId: string): Promise<ApiResponse<PatientResponse>> {
    const response = await apiClient.get<ApiResponse<PatientResponse>>(`/patients/${patientId}`);
    return response.data;
  },

  async getSummary(patientId: string): Promise<ApiResponse<PatientSummaryDTO>> {
    const response = await apiClient.get<ApiResponse<PatientSummaryDTO>>(`/patients/${patientId}/summary`);
    return response.data;
  },

  async create(request: CreatePatientRequest): Promise<ApiResponse<PatientResponse>> {
    const response = await apiClient.post<ApiResponse<PatientResponse>>('/patients', request);
    return response.data;
  },

  async update(patientId: string, request: Partial<CreatePatientRequest>): Promise<ApiResponse<PatientResponse>> {
    const response = await apiClient.put<ApiResponse<PatientResponse>>(`/patients/${patientId}`, request);
    return response.data;
  },

  async getPrescriptions(patientId: string): Promise<ApiResponse<PrescriptionDTO[]>> {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO[]>>(`/patients/${patientId}/prescriptions`);
    return response.data;
  },

  async getFullHistory(patientId: string): Promise<ApiResponse<PatientHistoryDTO>> {
    const response = await apiClient.get<ApiResponse<PatientHistoryDTO>>(`/patients/${patientId}/full-history`);
    return response.data;
  },

  async getHistorySummary(patientId: string): Promise<ApiResponse<PatientHistorySummaryDTO>> {
    const response = await apiClient.get<ApiResponse<PatientHistorySummaryDTO>>(`/patients/${patientId}/history-summary`);
    return response.data;
  },

  async save(data: CreatePatientRequest): Promise<ApiResponse<PatientResponse>> {
    if (data.id) {
      return this.update(data.id, data);
    }
    return this.create(data);
  }
};
