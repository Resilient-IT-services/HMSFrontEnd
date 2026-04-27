import apiClient from './apiClient';
import { ApiResponse, PageResponse, HospitalResponse, CreateHospitalRequest } from '@/types/api';

export const hospitalService = {
  async list(page = 0, size = 20, name?: string, status?: string): Promise<ApiResponse<PageResponse<HospitalResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<HospitalResponse>>>('/hospitals', {
      params: { page, size, name, status }
    });
    return response.data;
  },

  async create(request: CreateHospitalRequest): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.post<ApiResponse<HospitalResponse>>('/hospitals', request);
    return response.data;
  },

  async update(hospitalId: string, request: Partial<CreateHospitalRequest> & { status?: string }): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.put<ApiResponse<HospitalResponse>>(`/hospitals/${hospitalId}`, request);
    return response.data;
  },

  async save(data: CreateHospitalRequest & { status?: string }): Promise<ApiResponse<HospitalResponse>> {
    if (data.id) {
      return this.update(data.id, data);
    }
    return this.create(data);
  },

  async getById(hospitalId: string): Promise<ApiResponse<HospitalResponse>> {
    const { data } = await apiClient.get<ApiResponse<HospitalResponse>>(`/hospitals/${hospitalId}`);
    return data;
  }
};
