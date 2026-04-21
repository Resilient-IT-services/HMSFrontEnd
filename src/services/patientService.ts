import apiClient from './apiClient';
import { ApiResponse, PageResponse, PatientResponse, CreatePatientRequest } from '@/types/api';

export const patientService = {
  async list(page = 0, size = 20): Promise<ApiResponse<PageResponse<PatientResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PatientResponse>>>('/patients', {
      params: { page, size }
    });
    return response.data;
  },

  async get(id: number): Promise<ApiResponse<PatientResponse>> {
    const response = await apiClient.get<ApiResponse<PatientResponse>>(`/patients/${id}`);
    return response.data;
  },

  async create(request: CreatePatientRequest): Promise<ApiResponse<PatientResponse>> {
    const response = await apiClient.post<ApiResponse<PatientResponse>>('/patients', request);
    return response.data;
  }
};
