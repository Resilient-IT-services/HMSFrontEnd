import apiClient from '@/services/apiClient';
import { 
  ApiResponse, 
  PageResponse, 
  PrescriptionDTO, 
  PatientResponse, 
  MedicineResponse, 
  MedicineRequestDTO,
  PharmacyStockDTO,
  InventoryItemResponse,
  InventoryItemRequestDTO,
  StockTransactionRequestDTO
} from '@/types/api';

export const pharmacyApi = {
  // Prescription Management
  getPrescriptions: async (params?: { search?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionDTO>>>('/pharmacy/prescriptions', { params });
    return response.data;
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  markAsDispensed: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/pharmacy/prescriptions/${id}/dispense`);
    return response.data;
  },

  // Medicine Management (Pharmacy Catalog)
  getMedicines: async (params?: { search?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineResponse>>>('/pharmacy/medicines', { params });
    return response.data;
  },

  getMedicineStock: async (params?: { lowStock?: boolean; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/medicines/stock', { params });
    return response.data;
  },

  addMedicine: async (data: MedicineRequestDTO) => {
    const response = await apiClient.post<ApiResponse<MedicineResponse>>('/pharmacy/medicines', data);
    return response.data;
  },

  getMedicineById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<MedicineResponse>>(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  updateMedicine: async (id: string, data: MedicineRequestDTO) => {
    const response = await apiClient.put<ApiResponse<MedicineResponse>>(`/pharmacy/medicines/${id}`, data);
    return response.data;
  },

  deleteMedicine: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  // Inventory Item Catalog (Generic Items)
  getInventoryItems: async (params?: { search?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItemResponse>>>('/inventory/items', { params });
    return response.data;
  },

  defineInventoryItem: async (data: InventoryItemRequestDTO) => {
    const response = await apiClient.post<ApiResponse<InventoryItemResponse>>('/inventory/items', data);
    return response.data;
  },

  // Stock Transactions
  updateStock: async (data: StockTransactionRequestDTO) => {
    const response = await apiClient.post<ApiResponse<void>>('/inventory/stock', data);
    return response.data;
  },

  // Patient Info
  getPatientById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PatientResponse>>(`/patients/${id}`);
    return response.data;
  },

  getPatientHistory: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/patients/${id}/history`);
    return response.data;
  }
};
