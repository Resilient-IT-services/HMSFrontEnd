import apiClient from '@/services/apiClient';
import { ApiResponse } from '@/types/api';

export interface LabDepartmentDTO {
    id?: string;
    code: string;
    name: string;
    active: boolean;
}

export interface LabTestDTO {
    id?: string;
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

export interface HospitalLabDashboardStatsDTO {
    activeLocalTests: number;
    todayPendingOrders: number;
    todayProcessingOrders: number;
    todayVerifiedReports: number;
    todayEstimatedRevenue: number;
}

export interface HospitalLabTestConfigDTO {
    testId: string;
    testCode: string;
    testName: string;
    departmentName?: string;
    enabled: boolean;
    tatValue?: number;
    tatUnit?: string;
    standardPrice?: number;
    emergencyPrice?: number;
}

export const labApi = {
    // Hospital Admin Features
    getDashboardStats: async () => {
        const response = await apiClient.get<ApiResponse<HospitalLabDashboardStatsDTO>>('/hospital/lab/dashboard/stats');
        return response.data;
    },
    getAdminTests: async () => {
        const response = await apiClient.get<ApiResponse<HospitalLabTestConfigDTO[]>>('/hospital/lab/settings/tests');
        return response.data;
    },
    configureAdminTest: async (data: HospitalLabTestConfigDTO) => {
        const response = await apiClient.put<ApiResponse<void>>('/hospital/lab/settings/tests', data);
        return response.data;
    },
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
    },

    // Orders
    createOrder: async (data: { patientId: string, encounterId: string, testIds: string[], packageIds: string[] }) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/orders', data);
        return response.data;
    },
    getQueue: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/lab/orders/queue');
        return response.data;
    },
    saveResults: async (data: { orderTestId: string, results: any[] }) => {
        const response = await apiClient.post<ApiResponse<void>>('/lab/orders/results', data);
        return response.data;
    },
    getReportPreview: async (orderId: string) => {
        const response = await apiClient.get<ApiResponse<any>>(`/lab/reports/preview/${orderId}`);
        return response.data;
    }
};
