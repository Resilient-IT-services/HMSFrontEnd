import apiClient from './apiClient';
import { ApiResponse, PageResponse, PrescriptionResponse, PrescriptionDTO } from '@/types/api';

export const pharmacyService = {
  async listPrescriptions(): Promise<ApiResponse<PageResponse<PrescriptionResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionResponse>>>('/pharmacy/prescriptions');
    return response.data;
  },

  async createPrescription(request: PrescriptionDTO): Promise<ApiResponse<PrescriptionDTO>> {
    const response = await apiClient.post<ApiResponse<PrescriptionDTO>>('/pharmacy/prescriptions', request);
    return response.data;
  },

  async getLowStockCount(): Promise<ApiResponse<{ totalElements: number }>> {
    const response = await apiClient.get<ApiResponse<{ totalElements: number }>>('/pharmacy/stock?lowStock=true');
    return response.data;
  }
};
