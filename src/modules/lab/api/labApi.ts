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
    hsnCode?: string;
    sacCode?: string;
    active: boolean;
}

export interface LabTestParameterDTO {
    id?: string;
    testId: string;
    parameterName: string;
    unit?: string;
    displayOrder?: number;
}

export interface LabReferenceRangeDTO {
    id?: string;
    parameterId: string;
    gender: string;
    minAge?: number;
    maxAge?: number;
    ageUnit: string;
    minValue?: number;
    maxValue?: number;
    criticalMin?: number;
    criticalMax?: number;
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
    },

    // Parameters
    getParametersByTest: async (testId: string) => {
        const response = await apiClient.get<ApiResponse<LabTestParameterDTO[]>>(`/lab/parameters/test/${testId}`);
        return response.data;
    },
    createParameter: async (data: LabTestParameterDTO) => {
        const response = await apiClient.post<ApiResponse<LabTestParameterDTO>>('/lab/parameters', data);
        return response.data;
    },
    updateParameter: async (id: string, data: LabTestParameterDTO) => {
        const response = await apiClient.put<ApiResponse<LabTestParameterDTO>>(`/lab/parameters/${id}`, data);
        return response.data;
    },
    deleteParameter: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/parameters/${id}`);
        return response.data;
    },

    // Ranges
    getRangesByParameter: async (parameterId: string) => {
        const response = await apiClient.get<ApiResponse<LabReferenceRangeDTO[]>>(`/lab/parameters/${parameterId}/ranges`);
        return response.data;
    },
    createRange: async (data: LabReferenceRangeDTO) => {
        const response = await apiClient.post<ApiResponse<LabReferenceRangeDTO>>('/lab/parameters/ranges', data);
        return response.data;
    },
    updateRange: async (id: string, data: LabReferenceRangeDTO) => {
        const response = await apiClient.put<ApiResponse<LabReferenceRangeDTO>>(`/lab/parameters/ranges/${id}`, data);
        return response.data;
    },
    deleteRange: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/parameters/ranges/${id}`);
        return response.data;
    },

    // Pricing
    getPricingByTest: async (testId: string) => {
        const response = await apiClient.get<ApiResponse<any>>(`/lab/pricing/test/${testId}`);
        return response.data;
    },
    savePricing: async (data: any) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/pricing', data);
        return response.data;
    }
};
