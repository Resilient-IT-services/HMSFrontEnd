import apiClient from './apiClient';
import { ApiResponse, BillingDTO, UpdateBillingStatusRequest } from '@/types/api';

export const billingService = {
  async create(data: BillingDTO): Promise<ApiResponse<BillingDTO>> {
    const response = await apiClient.post<ApiResponse<BillingDTO>>('/billing', data);
    return response.data;
  },

  async updateStatus(billingId: string, status: any, paymentMethod?: string, discount?: number): Promise<ApiResponse<BillingDTO>> {
    const payload: UpdateBillingStatusRequest = {
      status,
      paymentMethod,
      discount
    };
    const response = await apiClient.put<ApiResponse<BillingDTO>>(`/billing/${billingId}/status-v2`, payload);
    return response.data;
  },

  async getByAppointment(appointmentId: string): Promise<ApiResponse<BillingDTO>> {
    try {
      const response = await apiClient.get<ApiResponse<BillingDTO>>(`/billing/appointment/${appointmentId}`, {
        skipToast: true
      });
      return response.data;
    } catch (error) {
      return { success: false, data: undefined as any };
    }
  }
};
