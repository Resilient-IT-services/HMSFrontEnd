import apiClient from './apiClient';
import {
  ApiResponse,
  PageResponse,
  PrescriptionResponse,
  PrescriptionDTO,
  MedicineResponse,
  MedicineRequestDTO,
  PharmacyStockDTO,
  InventoryItemResponse,
  InventoryItemRequestDTO,
  StockTransactionRequestDTO
} from '@/types/api';
import { AxiosError } from 'axios';

export const pharmacyService = {
  // Prescription Management
  async listPrescriptions(): Promise<ApiResponse<PageResponse<PrescriptionResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionResponse>>>('/pharmacy/prescriptions');
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

  // Medicine Management
  async listMedicines(params?: { search?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<MedicineResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineResponse>>>('/pharmacy/medicines', { params });
    return response.data;
  },

  async listStock(params?: { lowStock?: boolean; page?: number; size?: number }): Promise<ApiResponse<PageResponse<PharmacyStockDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/medicines/stock', { params });
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

  // Inventory Management
  async listInventoryItems(params?: { search?: string; page?: number; size?: number }): Promise<ApiResponse<PageResponse<InventoryItemResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItemResponse>>>('/inventory/items', { params });
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
      const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/medicines/stock', {
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
  }
};
