import apiClient from '@/services/apiClient';
import { ApiResponse } from '@/types/api';

export interface LabDepartmentDTO {
    id?: string;
    hospitalId?: string;
    code: string;
    name: string;
    active: boolean;
}

export interface LabTestDTO {
    id?: string;
    hospitalId?: string;
    testCode: string;
    testName: string;
    shortName?: string;
    aliasName?: string;
    departmentId: string;
    departmentName?: string;
    resultType: string;
    tatValue?: number;
    tatUnit?: string;
    active: boolean;
}

export const labApi = {
    // Departments
    getDepartments: async () => {
        const response = await apiClient.get<ApiResponse<LabDepartmentDTO[]>>('/lab/departments');
        return response.data;
    },
    createDepartment: async (data: LabDepartmentDTO) => {
        const response = await apiClient.post<ApiResponse<LabDepartmentDTO>>('/lab/departments', data);
        return response.data;
    },
    updateDepartment: async (id: string, data: LabDepartmentDTO) => {
        const response = await apiClient.put<ApiResponse<LabDepartmentDTO>>(`/lab/departments/${id}`, data);
        return response.data;
    },
    deleteDepartment: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/departments/${id}`);
        return response.data;
    },

    // Tests
    getTests: async () => {
        const response = await apiClient.get<ApiResponse<LabTestDTO[]>>('/lab/tests');
        return response.data;
    },
    createTest: async (data: LabTestDTO) => {
        const response = await apiClient.post<ApiResponse<LabTestDTO>>('/lab/tests', data);
        return response.data;
    },
    updateTest: async (id: string, data: LabTestDTO) => {
        const response = await apiClient.put<ApiResponse<LabTestDTO>>(`/lab/tests/${id}`, data);
        return response.data;
    },
    deleteTest: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/tests/${id}`);
        return response.data;
    }
};
