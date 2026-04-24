import apiClient from './apiClient';
import { ApiResponse, HospitalResponse, CreateHospitalRequest } from '@/types/api';

export const hospitalService = {
  async list(): Promise<ApiResponse<HospitalResponse[]>> {
    const response = await apiClient.get<ApiResponse<HospitalResponse[]>>('/hospitals');
    return response.data;
  },

  async create(request: CreateHospitalRequest): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.post<ApiResponse<HospitalResponse>>('/hospitals', request);
    return response.data;
  },

  async update(id: number, request: Partial<CreateHospitalRequest> & { status?: string }): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.put<ApiResponse<HospitalResponse>>(`/hospitals/${id}`, request);
    return response.data;
  },

  async getById(id: number): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.get<ApiResponse<HospitalResponse>>(`/hospitals/${id}`);
    return response.data;
  }
};
