import apiClient from '@/services/apiClient';
import { ApiResponse, LaboratoryTestDTO } from '@/types/api';

export const laboratoryApi = {
  getTests: async () => {
    const response = await apiClient.get<ApiResponse<LaboratoryTestDTO[]>>('/laboratory/tests');
    return response.data;
  },

  createTest: async (data: LaboratoryTestDTO) => {
    const response = await apiClient.post<ApiResponse<LaboratoryTestDTO>>('/laboratory/tests', data);
    return response.data;
  }
};
