import { AxiosRequestConfig } from 'axios';
import apiClient from './apiClient';
import { ApiResponse, VitalRangeConfigDTO, AdminStatsDTO, AdminDashboardSummary } from '@/types/api';

export const adminService = {
  async getDashboardSummary(): Promise<ApiResponse<AdminDashboardSummary>> {
    const response = await apiClient.get<ApiResponse<AdminDashboardSummary>>('/admin/dashboard/summary');
    return response.data;
  },

  async getAdminStats(): Promise<ApiResponse<AdminStatsDTO>> {
    const response = await apiClient.get<ApiResponse<AdminStatsDTO>>('/admin/stats');
    return response.data;
  },

  async listVitalSettings(config?: AxiosRequestConfig): Promise<ApiResponse<VitalRangeConfigDTO[]>> {
    const response = await apiClient.get<ApiResponse<VitalRangeConfigDTO[]>>('/admin/vital-ranges', config);
    return response.data;
  },

  async saveVitalSetting(setting: VitalRangeConfigDTO): Promise<ApiResponse<VitalRangeConfigDTO>> {
    const response = await apiClient.put<ApiResponse<VitalRangeConfigDTO>>(`/admin/vital-ranges/${setting.vitalType}`, setting);
    return response.data;
  }
};

export {type VitalSetting} from '@/types/api';
