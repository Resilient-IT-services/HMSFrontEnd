import apiClient from '@/services/apiClient';
import { ApiResponse, PageResponse, PrescriptionDTO, PatientResponse, AppointmentResponse } from '@/types/api';

export const pharmacyApi = {
  getPrescriptions: async (params?: { search?: string; page?: number; size?: number }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<PrescriptionDTO>>>('/pharmacy/prescriptions', { params });
    return response.data;
  },

  getPrescriptionById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PrescriptionDTO>>(`/pharmacy/prescriptions/${id}`);
    return response.data;
  },

  getPatientById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<PatientResponse>>(`/patients/${id}`);
    return response.data;
  },

  getPatientHistory: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/patients/${id}/history`);
    return response.data;
  },

  markAsDispensed: async (id: string) => {
    // Backend API not available, so this might be a placeholder or a call to a different endpoint
    // For now, following instructions to maintain frontend state if backend not available.
    // However, I'll define it here.
    const response = await apiClient.post<ApiResponse<void>>(`/pharmacy/prescriptions/${id}/dispense`);
    return response.data;
  },

  getInventory: async (params?: { search?: string; page?: number; size?: number; category?: string; status?: string }) => {
    const response = await apiClient.get<ApiResponse<PageResponse<any>>>('/pharmacy/medicines', { params });
    return response.data;
  },

  addMedicine: async (data: any) => {
    const response = await apiClient.post<ApiResponse<any>>('/pharmacy/medicines', data);
    return response.data;
  },

  updateMedicine: async (id: string, data: any) => {
    const response = await apiClient.put<ApiResponse<any>>(`/pharmacy/medicines/${id}`, data);
    return response.data;
  }
};
