import apiClient from '@/services/apiClient';
import { ApiResponse, PageResponse } from '@/types/api';

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

export interface LabQueueItemDTO {
    orderId: string;
    orderTestId: string;
    orderNumber: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    testName: string;
    status: string;
    orderedAt: string;
}

export interface LabPackageDTO {
    id?: string;
    packageCode: string;
    packageName: string;
    active: boolean;
    testIds: string[];
}

export interface LabInventoryItemDTO {
    id?: string;
    itemCode: string;
    itemName: string;
    unit: string;
    availableQty?: number;
    reorderLevel?: number;
}

export interface LabMachineDTO {
    id?: string;
    machineCode: string;
    machineName: string;
    manufacturer: string;
    serialNumber: string;
}

export const labApi = {
    // ... existing methods ...
    // Packages
    getPackages: async () => {
        const response = await apiClient.get<ApiResponse<LabPackageDTO[]>>('/lab/packages');
        return response.data;
    },
    createPackage: async (data: LabPackageDTO) => {
        const response = await apiClient.post<ApiResponse<LabPackageDTO>>('/lab/packages', data);
        return response.data;
    },
    updatePackage: async (id: string, data: LabPackageDTO) => {
        const response = await apiClient.put<ApiResponse<LabPackageDTO>>(`/lab/packages/${id}`, data);
        return response.data;
    },
    deletePackage: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/packages/${id}`);
        return response.data;
    },

    // Inventory
    getInventory: async () => {
        const response = await apiClient.get<ApiResponse<LabInventoryItemDTO[]>>('/lab/inventory');
        return response.data;
    },
    createInventoryItem: async (data: LabInventoryItemDTO) => {
        const response = await apiClient.post<ApiResponse<LabInventoryItemDTO>>('/lab/inventory/items', data);
        return response.data;
    },
    recordInventoryTransaction: async (itemId: string, quantity: number, type: 'ADD' | 'REMOVE') => {
        const response = await apiClient.post<ApiResponse<void>>('/lab/inventory/transactions', null, {
            params: { itemId, quantity, type }
        });
        return response.data;
    },

    // Machines
    getMachines: async () => {
        const response = await apiClient.get<ApiResponse<LabMachineDTO[]>>('/lab/machines');
        return response.data;
    },
    createMachine: async (data: LabMachineDTO) => {
        const response = await apiClient.post<ApiResponse<LabMachineDTO>>('/lab/machines', data);
        return response.data;
    },
    updateMachine: async (id: string, data: LabMachineDTO) => {
        const response = await apiClient.put<ApiResponse<LabMachineDTO>>(`/lab/machines/${id}`, data);
        return response.data;
    },
    deleteMachine: async (id: string) => {
        const response = await apiClient.delete<ApiResponse<void>>(`/lab/machines/${id}`);
        return response.data;
    },

    // Verification
    verifyResult: async (orderTestId: string, remarks: string, status: 'VERIFIED' | 'REJECTED') => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/tests/${orderTestId}/verify`, null, {
            params: { remarks, status }
        });
        return response.data;
    },

    // Existing methods
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
    // Technician Features
    getPagedQueue: async (status?: string, page = 0, size = 20) => {
        const response = await apiClient.get<ApiResponse<PageResponse<LabQueueItemDTO>>>('/lab/orders/queue/paged', {
            params: { status, page, size }
        });
        return response.data;
    },
    collectSample: async (orderTestId: string) => {
        const response = await apiClient.post<ApiResponse<string>>(`/lab/orders/tests/${orderTestId}/collect`);
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
    getParametersByOrderTest: async (orderTestId: string) => {
        const response = await apiClient.get<ApiResponse<LabTestParameterDTO[]>>(`/lab/orders/tests/${orderTestId}/parameters`);
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
