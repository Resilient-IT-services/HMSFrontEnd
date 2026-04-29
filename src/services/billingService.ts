import apiClient from './apiClient';
import { ApiResponse, BillingDTO } from '@/types/api';

export const billingService = {
  async create(data: BillingDTO): Promise<ApiResponse<BillingDTO>> {
    const response = await apiClient.post<ApiResponse<BillingDTO>>('/billing', data);
    return response.data;
  },

  async updateStatus(billingId: string, status: string): Promise<ApiResponse<BillingDTO>> {
    const response = await apiClient.put<ApiResponse<BillingDTO>>(`/billing/${billingId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  async getByAppointment(appointmentId: string): Promise<ApiResponse<BillingDTO>> {
    const response = await apiClient.get<ApiResponse<BillingDTO>>(`/billing/appointment/${appointmentId}`);
    return response.data;
  }
};
