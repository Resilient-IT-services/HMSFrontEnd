import apiClient from '@/services/apiClient';
import { ApiResponse, LaboratoryTestDTO, LabDepartmentDTO } from '@/types/api';

export const laboratoryApi = {
  getTests: async () => {
    const response = await apiClient.get<ApiResponse<LaboratoryTestDTO[]>>('/lab/tests');
    return response.data;
  },

  createTest: async (data: LaboratoryTestDTO) => {
    const response = await apiClient.post<ApiResponse<LaboratoryTestDTO>>('/lab/tests', data);
    return response.data;
  },

  getDepartments: async () => {
    const response = await apiClient.get<ApiResponse<LabDepartmentDTO[]>>('/lab/departments');
    return response.data;
  }
};
