import apiClient from './apiClient';
import { 
  ApiResponse, 
  TaxMasterDTO, 
  TaxGroupDTO, 
  TaxRuleDTO, 
  TaxCalculationRequest, 
  TaxCalculationResult 
} from '@/types/api';

export const taxService = {
  // Calculation
  calculate: async (request: TaxCalculationRequest): Promise<ApiResponse<TaxCalculationResult>> => {
    const response = await apiClient.post<ApiResponse<TaxCalculationResult>>('/tax/calculate', request);
    return response.data;
  },

  // Tax Masters
  getAllMasters: async (): Promise<ApiResponse<TaxMasterDTO[]>> => {
    const response = await apiClient.get<ApiResponse<TaxMasterDTO[]>>('/tax/config/masters');
    return response.data;
  },
  createMaster: async (data: TaxMasterDTO): Promise<ApiResponse<TaxMasterDTO>> => {
    const response = await apiClient.post<ApiResponse<TaxMasterDTO>>('/tax/config/masters', data);
    return response.data;
  },
  updateMaster: async (id: string, data: TaxMasterDTO): Promise<ApiResponse<TaxMasterDTO>> => {
    const response = await apiClient.put<ApiResponse<TaxMasterDTO>>(`/tax/config/masters/${id}`, data);
    return response.data;
  },
  deleteMaster: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tax/config/masters/${id}`);
    return response.data;
  },

  // Tax Groups
  getAllGroups: async (): Promise<ApiResponse<TaxGroupDTO[]>> => {
    const response = await apiClient.get<ApiResponse<TaxGroupDTO[]>>('/tax/config/groups');
    return response.data;
  },
  createGroup: async (data: TaxGroupDTO): Promise<ApiResponse<TaxGroupDTO>> => {
    const response = await apiClient.post<ApiResponse<TaxGroupDTO>>('/tax/config/groups', data);
    return response.data;
  },
  updateGroup: async (id: string, data: TaxGroupDTO): Promise<ApiResponse<TaxGroupDTO>> => {
    const response = await apiClient.put<ApiResponse<TaxGroupDTO>>(`/tax/config/groups/${id}`, data);
    return response.data;
  },
  deleteGroup: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tax/config/groups/${id}`);
    return response.data;
  },

  // Tax Rules
  getAllRules: async (): Promise<ApiResponse<TaxRuleDTO[]>> => {
    const response = await apiClient.get<ApiResponse<TaxRuleDTO[]>>('/tax/config/rules');
    return response.data;
  },
  createRule: async (data: TaxRuleDTO): Promise<ApiResponse<TaxRuleDTO>> => {
    const response = await apiClient.post<ApiResponse<TaxRuleDTO>>('/tax/config/rules', data);
    return response.data;
  },
  updateRule: async (id: string, data: TaxRuleDTO): Promise<ApiResponse<TaxRuleDTO>> => {
    const response = await apiClient.put<ApiResponse<TaxRuleDTO>>(`/tax/config/rules/${id}`, data);
    return response.data;
  },
  deleteRule: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tax/config/rules/${id}`);
    return response.data;
  }
};
