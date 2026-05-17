import { AxiosRequestConfig } from 'axios';
import apiClient from './apiClient';
import { ApiResponse, VitalRangesResponse, VitalRange, VitalRangeConfigDTO } from '@/types/api';



export const adminService = {
  async listVitalSettings(config?: AxiosRequestConfig): Promise<ApiResponse<VitalRangeConfigDTO[]>> {
    const response = await apiClient.get<ApiResponse<VitalRangeConfigDTO[]>>('/admin/vital-ranges', config);
    return response.data;
  },

  async saveVitalSetting(setting: VitalRangeConfigDTO): Promise<ApiResponse<VitalRangeConfigDTO>> {
    const response = await apiClient.put<ApiResponse<VitalRangeConfigDTO>>(`/admin/vital-ranges/${setting.vitalType}`, setting);
    return response.data;
  },

  async getVitalRanges(config?: AxiosRequestConfig): Promise<ApiResponse<VitalRangesResponse>> {
    const response = await apiClient.get<ApiResponse<VitalRangesResponse>>('/admin/vital-ranges', config);
    return response.data;
  },

  async updateVitalRange(type: string, range: Partial<VitalRange>, config?: AxiosRequestConfig): Promise<ApiResponse<VitalRange>> {
    const response = await apiClient.put<ApiResponse<VitalRange>>(`/admin/vital-ranges/${type}`, range, config);
    return response.data;
  }
};

export {type VitalSetting} from '@/types/api';