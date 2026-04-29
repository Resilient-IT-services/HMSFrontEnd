import apiClient from './apiClient';
import { ApiResponse, PageResponse, PrescriptionResponse, PrescriptionDTO } from '@/types/api';
import { AxiosError } from 'axios';

export const pharmacyService = {
  async listPrescriptions(): Promise<ApiResponse<PageResponse<PrescriptionResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionResponse>>>('/pharmacy/prescriptions');
    return response.data;
  },

  async get(id: string): Promise<ApiResponse<PrescriptionDTO>> {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  async createPrescription(request: PrescriptionDTO): Promise<ApiResponse<PrescriptionDTO>> {
    const response = await apiClient.post<ApiResponse<PrescriptionDTO>>('/pharmacy/prescriptions', request);
    return response.data;
  },

  async getLowStockCount(): Promise<ApiResponse<{ totalElements: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<{ totalElements: number }>>('/pharmacy/stock?lowStock=true');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Pharmacy getLowStockCount Error:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      return {
        success: false,
        message: 'Failed to fetch low stock count',
        data: { totalElements: 0 }
      };
    }
  }
};
