import apiClient from './apiClient';
import { ApiResponse, PageResponse, HospitalResponse, CreateHospitalRequest, HospitalSelectionDTO } from '@/types/api';

export const hospitalService = {
  async list(params: { page?: number; size?: number; name?: string; city?: string; status?: string; sort?: string; search?: string } = {}): Promise<ApiResponse<PageResponse<HospitalResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<HospitalResponse>>>('/hospitals', {
      params: { page: 0, size: 20, ...params }
    });
    return response.data;
  },

  async getHospitalsSelection(): Promise<ApiResponse<HospitalSelectionDTO[]>> {
    const response = await apiClient.get<ApiResponse<HospitalSelectionDTO[]>>('/hospitals/selection');
    return response.data;
  },

  async create(data: CreateHospitalRequest): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.post<ApiResponse<HospitalResponse>>('/hospitals', data);
    return response.data;
  },

  async update(hospitalId: string, data: CreateHospitalRequest): Promise<ApiResponse<HospitalResponse>> {
    const response = await apiClient.put<ApiResponse<HospitalResponse>>(`/hospitals/${hospitalId}`, data);
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
