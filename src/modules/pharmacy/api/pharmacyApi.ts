import apiClient from '@/services/apiClient';
import { 
  ApiResponse, 
  PageResponse, 
  PrescriptionDTO, 
  PrescriptionSummaryDTO,
  PatientResponse, 
  MedicineResponse, 
  MedicineSummaryDTO,
  MedicineRequestDTO,
  PharmacyStockDTO,
  InventoryItemResponse,
  InventoryItemRequestDTO,
  StockTransactionRequestDTO,
  StockRequest,
  PharmacySaleRequest,
  PharmacySaleResponse,
  PharmacyReturnRequest,
  PharmacyReturnResponse
} from '@/types/api';
import { LOW_STOCK_THRESHOLD, EXPIRY_ALERT_DAYS } from '@/utils/constants';

export const pharmacyApi = {
  // Prescription Management
  getPrescriptions: async (params?: { search?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionDTO>>>('/pharmacy/prescriptions', { params: queryParams });
    return response.data;
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  getPrescriptionsSummary: async (params?: { search?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionSummaryDTO>>>('/pharmacy/prescriptions/summary', { params: queryParams });
    return response.data;
  },

  markAsDispensed: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/pharmacy/prescriptions/${id}/dispense`);
    return response.data;
  },

  // Medicine Management (Pharmacy Catalog)
  getMedicines: async (params?: { search?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineResponse>>>('/pharmacy/medicines', { params: queryParams });
    return response.data;
  },

  getMedicinesSummary: async (params?: { search?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineSummaryDTO>>>('/pharmacy/medicines/summary', { params: queryParams });
    return response.data;
  },

  importMedicines: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<void>>('/pharmacy/medicines/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getAvailableMedicines: async (search: string) => {
    const params: any = {};
    if (search && search.trim()) params.search = search;
    const response = await apiClient.get<ApiResponse<MedicineResponse[]>>('/pharmacy/medicines/available', {
      params
    });
    return response.data;
  },

  getMedicineStock: async (params?: { search?: string; page?: number; size?: number; lowStock?: boolean; expired?: boolean; expiringSoon?: boolean }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/stock', { params: queryParams });
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

  // Stock Management
  addStock: async (data: StockRequest) => {
    const response = await apiClient.post<ApiResponse<PharmacyStockDTO>>('/pharmacy/stock', data);
    return response.data;
  },

  updateStock: async (data: StockTransactionRequestDTO) => {
    const response = await apiClient.post<ApiResponse<void>>('/inventory/stock', data);
    return response.data;
  },

  importStock: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<void>>('/pharmacy/stock/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Sale & Returns
  createSale: async (saleData: PharmacySaleRequest) => {
    const response = await apiClient.post<ApiResponse<PharmacySaleResponse>>('/pharmacy/sales', saleData);
    return response.data;
  },

  processReturn: async (returnData: PharmacyReturnRequest) => {
    const response = await apiClient.post<ApiResponse<PharmacyReturnResponse>>('/pharmacy/returns', returnData);
    return response.data;
  },

  // Alerts
  getLowStockAlerts: async (threshold: number = LOW_STOCK_THRESHOLD) => {
    const response = await apiClient.get<ApiResponse<MedicineResponse[]>>('/pharmacy/alerts/low-stock', {
      params: { threshold }
    });
    return response.data;
  },

  getExpiryAlerts: async (days: number = EXPIRY_ALERT_DAYS) => {
    const response = await apiClient.get<ApiResponse<MedicineResponse[]>>('/pharmacy/alerts/expiry', {
      params: { days }
    });
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
  },

  // Inventory Management
  getInventoryItems: async (params?: { search?: string; page?: number; size?: number }) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItemResponse>>>('/inventory/items', { params: queryParams });
    return response.data;
  },

  defineInventoryItem: async (data: InventoryItemRequestDTO) => {
    const response = await apiClient.post<ApiResponse<InventoryItemResponse>>('/inventory/items', data);
    return response.data;
  }
};
