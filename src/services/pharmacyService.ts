import apiClient from './apiClient';
import {
  ApiResponse,
  PageResponse,
  PrescriptionResponse,
  PrescriptionDTO,
  PrescriptionSummaryDTO,
  MedicineResponse,
  MedicineRequestDTO,
  MedicineSummaryDTO,
  PharmacyStockDTO,
  InventoryItemResponse,
  InventoryItemRequestDTO,
  StockTransactionRequestDTO,
  StockRequest,
  QuickPharmacySaleRequest,
  QuickPharmacySaleResponse,
  PharmacyReturnRequest,
  PharmacyReturnResponse,
  InventoryStockDTO
} from '@/types/api';
import { AxiosError } from 'axios';

export const pharmacyService = {
  // Prescription Management
  async listPrescriptions(params?: { search?: string; page?: number; size?: number; status?: string; sort?: string }): Promise<ApiResponse<PageResponse<PrescriptionResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionResponse>>>('/pharmacy/prescriptions', { params });
    return response.data;
  },

  async listPrescriptionsSummary(params?: { search?: string; page?: number; size?: number; status?: string; sort?: string }): Promise<ApiResponse<PageResponse<PrescriptionSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionSummaryDTO>>>('/pharmacy/prescriptions/summary', { params });
    return response.data;
  },

  async getPrescription(id: string): Promise<ApiResponse<PrescriptionDTO>> {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  async createPrescription(request: PrescriptionDTO): Promise<ApiResponse<PrescriptionDTO>> {
    const response = await apiClient.post<ApiResponse<PrescriptionDTO>>('/pharmacy/prescriptions', request);
    return response.data;
  },

  async cancelPrescription(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/pharmacy/prescriptions/${id}/cancel`);
    return response.data;
  },

  // Medicine Management
  async listMedicines(params?: { search?: string; page?: number; size?: number; category?: string; sort?: string }): Promise<ApiResponse<PageResponse<MedicineResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineResponse>>>('/pharmacy/medicines', { params });
    return response.data;
  },

  async listMedicinesSummary(params?: { search?: string; page?: number; size?: number; sort?: string }): Promise<ApiResponse<PageResponse<MedicineSummaryDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineSummaryDTO>>>('/pharmacy/medicines/summary', { params });
    return response.data;
  },

  async listStock(params?: { lowStock?: boolean; page?: number; size?: number; search?: string; medicineId?: string; sort?: string }): Promise<ApiResponse<PageResponse<PharmacyStockDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/stock', { params });
    return response.data;
  },

  async addStock(request: StockRequest): Promise<ApiResponse<PharmacyStockDTO>> {
    const response = await apiClient.post<ApiResponse<PharmacyStockDTO>>('/pharmacy/stock', request);
    return response.data;
  },

  async addMedicine(request: MedicineRequestDTO): Promise<ApiResponse<MedicineResponse>> {
    const response = await apiClient.post<ApiResponse<MedicineResponse>>('/pharmacy/medicines', request);
    return response.data;
  },

  async getMedicine(id: string): Promise<ApiResponse<MedicineResponse>> {
    const response = await apiClient.get<ApiResponse<MedicineResponse>>(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  async updateMedicine(id: string, request: MedicineRequestDTO): Promise<ApiResponse<MedicineResponse>> {
    const response = await apiClient.put<ApiResponse<MedicineResponse>>(`/pharmacy/medicines/${id}`, request);
    return response.data;
  },

  async deleteMedicine(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  async importMaster(file: File): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<void>>('/pharmacy/medicines/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async importStock(file: File): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<void>>('/pharmacy/stock/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async exportStock(): Promise<Blob> {
    const response = await apiClient.get('/pharmacy/stock/export', { responseType: 'blob' });
    return response.data;
  },

  // Sale & Returns
  async processSale(request: QuickPharmacySaleRequest): Promise<ApiResponse<QuickPharmacySaleResponse>> {
    const response = await apiClient.post<ApiResponse<QuickPharmacySaleResponse>>('/pharmacy/sales', request);
    return response.data;
  },

  async dispensePrescription(id: string, request: QuickPharmacySaleRequest): Promise<ApiResponse<QuickPharmacySaleResponse>> {
    const response = await apiClient.post<ApiResponse<QuickPharmacySaleResponse>>(`/pharmacy/prescriptions/${id}/dispense`, request);
    return response.data;
  },

  async getSale(id: string): Promise<ApiResponse<QuickPharmacySaleResponse>> {
    const response = await apiClient.get<ApiResponse<QuickPharmacySaleResponse>>(`/pharmacy/sales/${id}`);
    return response.data;
  },

  async getSaleByPrescription(prescriptionId: string): Promise<ApiResponse<QuickPharmacySaleResponse>> {
    const response = await apiClient.get<ApiResponse<QuickPharmacySaleResponse>>(`/pharmacy/sales/prescription/${prescriptionId}`);
    return response.data;
  },

  async searchRecentCustomers(search: string): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<ApiResponse<any[]>>('/pharmacy/recent-customers', { params: { search } });
    return response.data;
  },

  async processReturn(request: PharmacyReturnRequest): Promise<ApiResponse<PharmacyReturnResponse>> {
    const response = await apiClient.post<ApiResponse<PharmacyReturnResponse>>('/pharmacy/returns', request);
    return response.data;
  },

  // Alerts
  async getExpiryAlerts(days: number = 30): Promise<ApiResponse<PharmacyStockDTO[]>> {
    const response = await apiClient.get<ApiResponse<PharmacyStockDTO[]>>('/pharmacy/alerts/expiry', { params: { days } });
    return response.data;
  },

  async getLowStockAlerts(params?: { page?: number; size?: number; threshold?: number; sort?: string }): Promise<ApiResponse<PageResponse<PharmacyStockDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/alerts/low-stock', { params });
    return response.data;
  },

  // Inventory Management (Shared/General)
  async listInventoryItems(params?: { search?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<InventoryItemResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItemResponse>>>('/inventory/items', { params });
    return response.data;
  },

  async listInventoryStock(params?: { page?: number; size?: number }): Promise<ApiResponse<PageResponse<InventoryStockDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryStockDTO>>>('/inventory/stock', { params });
    return response.data;
  },

  async defineInventoryItem(request: InventoryItemRequestDTO): Promise<ApiResponse<InventoryItemResponse>> {
    const response = await apiClient.post<ApiResponse<InventoryItemResponse>>('/inventory/items', request);
    return response.data;
  },

  // Stock Transactions
  async updateStock(request: StockTransactionRequestDTO): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>('/inventory/stock', request);
    return response.data;
  },

  async getLowStockCount(): Promise<ApiResponse<{ totalElements: number }>> {
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/stock', {
        params: { lowStock: true, size: 1 }
      });
      return {
        success: response.data.success,
        message: response.data.message,
        data: { totalElements: response.data.data?.totalElements ?? 0 }
      };
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
  },

  async getDashboardStats(): Promise<ApiResponse<PharmacyDashboardStatsDTO>> {
    const response = await apiClient.get<ApiResponse<PharmacyDashboardStatsDTO>>('/pharmacy/dashboard/stats');
    return response.data;
  }
};
