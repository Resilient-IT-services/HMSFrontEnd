import apiClient from './apiClient';
import { ApiResponse, VitalSetting } from '@/types/api';

export type { VitalSetting };

export const adminService = {
  async listVitalSettings(): Promise<ApiResponse<VitalSetting[]>> {
    const response = await apiClient.get<ApiResponse<VitalSetting[]>>('/admin/vital-settings');
    return response.data;
  },

  async saveVitalSetting(setting: VitalSetting): Promise<ApiResponse<VitalSetting>> {
    const response = await apiClient.post<ApiResponse<VitalSetting>>('/admin/vital-settings', setting);
    return response.data;
  }
};
