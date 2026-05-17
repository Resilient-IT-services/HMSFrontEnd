import apiClient from './apiClient';
import { ApiResponse, InvoiceDTO } from '@/types/api';

export const invoiceService = {
  async getByVisit(visitId: string): Promise<ApiResponse<InvoiceDTO>> {
    const response = await apiClient.get<ApiResponse<InvoiceDTO>>(`/finance/invoices/visit/${visitId}`);
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<InvoiceDTO>> {
    const response = await apiClient.get<ApiResponse<InvoiceDTO>>(`/finance/invoices/${id}`);
    return response.data;
  },

  async recordPayment(request: RecordPaymentRequest): Promise<ApiResponse<PaymentDTO>> {
    const response = await apiClient.post<ApiResponse<PaymentDTO>>('/finance/payments', request);
    return response.data;
  }
};
