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
  MedicineImportResponse,
  StockImportResponse,
  PharmacyStockDTO,
  InventoryItemResponse,
  InventoryItemRequestDTO,
  StockTransactionRequestDTO,
  StockRequest,
  PharmacySaleRequest,
  PharmacyReturnRequest,
  PharmacyReturnResponse,
  QuickPharmacySaleRequest,
  QuickPharmacySaleResponse,
  PharmacyDashboardStatsDTO
} from '@/types/api';
import { LOW_STOCK_THRESHOLD, EXPIRY_ALERT_DAYS } from '@/utils/constants';

export const pharmacyApi = {
  // Prescription Management
  getPrescriptions: async (params?: { search?: string; page?: number; size?: number; status?: string; sort?: string } & Record<string, any>) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionDTO>>>('/pharmacy/prescriptions', { params: queryParams });
    return response.data;
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  cancelPrescription: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/pharmacy/prescriptions/${id}/cancel`);
    return response.data;
  },

  dispensePrescription: async (id: string, request: any) => {
    const response = await apiClient.post<ApiResponse<any>>(`/pharmacy/prescriptions/${id}/dispense`, request);
    return response.data;
  },

  getPrescriptionsSummary: async (params?: { search?: string; page?: number; size?: number; status?: string; sort?: string } & Record<string, any>) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionSummaryDTO>>>('/pharmacy/prescriptions/summary', { params: queryParams });
    return response.data;
  },

  // Medicine Management (Pharmacy Catalog)
  getMedicines: async (params?: { search?: string; page?: number; size?: number; sort?: string } & Record<string, any>) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineResponse>>>('/pharmacy/medicines', { params: queryParams });
    return response.data;
  },

  getMedicinesSummary: async (params?: { search?: string; page?: number; size?: number; sort?: string } & Record<string, any>) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<MedicineSummaryDTO>>>('/pharmacy/medicines/summary', { params: queryParams });
    return response.data;
  },

  importMedicines: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<MedicineImportResponse>>('/pharmacy/medicines/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  importInventoryItems: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<any>('/medicine-master/import-inventory-items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMedicineStock: async (params?: { 
    search?: string; 
    page?: number; 
    size?: number; 
    lowStock?: boolean; 
    expired?: boolean; 
    expiringSoon?: boolean;
    medicineId?: string;
    sort?: string;
  } & Record<string, any>) => {
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
  deleteStock: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/pharmacy/stock/${id}`);
    return response.data;
  },

  adjustStock: async (id: string, quantity: number) => {
    const response = await apiClient.put<ApiResponse<PharmacyStockDTO>>(`/pharmacy/stock/${id}/adjust`, null, {
      params: { quantity }
    });
    return response.data;
  },

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
    const response = await apiClient.post<ApiResponse<StockImportResponse>>('/pharmacy/stock/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  exportStockExcel: async () => {
    const response = await apiClient.get('/pharmacy/stock/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Sale & Returns
  createSale: async (saleData: PharmacySaleRequest) => {
    const response = await apiClient.post<ApiResponse<QuickPharmacySaleResponse>>('/pharmacy/sales', saleData);
    return response.data;
  },

  processReturn: async (returnData: PharmacyReturnRequest) => {
    const response = await apiClient.post<ApiResponse<PharmacyReturnResponse>>('/pharmacy/returns', returnData);
    return response.data;
  },

  // Alerts
  getLowStockAlerts: async (params?: { page?: number; size?: number; threshold?: number; sort?: string } & Record<string, any>) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PharmacyStockDTO>>>('/pharmacy/alerts/low-stock', {
      params: { threshold: LOW_STOCK_THRESHOLD, ...params }
    });
    return response.data;
  },

  getExpiryAlerts: async (days: number = EXPIRY_ALERT_DAYS) => {
    const response = await apiClient.get<ApiResponse<PharmacyStockDTO[]>>('/pharmacy/alerts/expiry', {
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
  getInventoryItems: async (params?: { search?: string; page?: number; size?: number; sort?: string } & Record<string, any>) => {
    const queryParams: any = { ...params };
    if (queryParams.search !== undefined && !queryParams.search.trim()) delete queryParams.search;
    const response = await apiClient.get<ApiResponse<PageResponse<InventoryItemResponse>>>('/inventory/items', { params: queryParams });
    return response.data;
  },

  defineInventoryItem: async (data: InventoryItemRequestDTO) => {
    const response = await apiClient.post<ApiResponse<InventoryItemResponse>>('/inventory/items', data);
    return response.data;
  },

  createQuickSale: async (data: QuickPharmacySaleRequest) => {
    const response = await apiClient.post<ApiResponse<QuickPharmacySaleResponse>>('/pharmacy/sales', data);
    return response.data;
  },

  getSale: async (id: string) => {
    const response = await apiClient.get<ApiResponse<QuickPharmacySaleResponse>>(`/pharmacy/sales/${id}`);
    return response.data;
  },

  getSaleByPrescription: async (prescriptionId: string) => {
    const response = await apiClient.get<ApiResponse<QuickPharmacySaleResponse>>(`/pharmacy/sales/prescription/${prescriptionId}`);
    return response.data;
  },

  searchRecentCustomers: async (search: string) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/pharmacy/recent-customers', {
      params: { search }
    });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get<ApiResponse<PharmacyDashboardStatsDTO>>('/pharmacy/dashboard/stats');
    return response.data;
  }
};
