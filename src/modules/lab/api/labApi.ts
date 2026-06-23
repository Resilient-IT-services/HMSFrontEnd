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
    category: 'LAB' | 'RADIOLOGY' | 'CARDIOLOGY';
    resultEntryType: 'PARAMETER' | 'NARRATIVE';
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
    resultValue?: string;
    abnormal?: boolean;
    critical?: boolean;
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
    category: string;
    resultEntryType: string;
    status: string;
    orderedAt: string;
    packageId?: string;
    packageName?: string;
    packageChildCount?: number;
}

export interface LabPackageResultBundleDTO {
    orderId: string;
    packageId: string;
    packageName: string;
    status: string;
    tests: {
        orderTestId: string;
        testId: string;
        testName: string;
        category: string;
        resultEntryType: string;
        status: string;
        findings?: string;
        parameters: LabTestParameterDTO[];
    }[];
}

export type PackageType = 'PROFILE' | 'PANEL' | 'SCREENING' | 'HEALTH_CHECKUP' | 'CUSTOM';
export type PackageStatus = 'PENDING' | 'COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED';

export interface LabPackageDTO {
    id?: string;
    packageCode: string;
    packageName: string;
    description?: string;
    active: boolean;
    packageType?: PackageType;
    versionNo?: number;
    isBillable?: boolean;
    testIds: string[];
}

export interface HospitalLabPackageConfigDTO {
    packageId: string;
    packageCode: string;
    packageName: string;
    description?: string;
    packageType?: string;
    versionNo?: number;
    enabled: boolean;
    standardPrice?: number;
    emergencyPrice?: number;
    testIds: string[];
}

export interface LabOrderPackageDTO {
    id: string;
    orderId: string;
    packageId: string;
    packageName?: string;
    packageVersion: number;
    parentOrderPackageId?: string;
    status: PackageStatus;
    isBillable: boolean;
    packagePrice?: number;
    discountAmount?: number;
    taxAmount?: number;
    finalAmount?: number;
    lockedForReporting: boolean;
    lockedAt?: string;
    lockedBy?: string;
    createdAt: string;
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

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = {
    PROFILE: 'Profile',
    PANEL: 'Panel',
    SCREENING: 'Screening',
    HEALTH_CHECKUP: 'Health Checkup',
    CUSTOM: 'Custom',
};

export const PACKAGE_STATUS_CONFIG: Record<PackageStatus, { label: string; variant: string }> = {
    PENDING: { label: 'Pending', variant: 'slate' },
    COLLECTED: { label: 'Collected', variant: 'blue' },
    PROCESSING: { label: 'Processing', variant: 'indigo' },
    COMPLETED: { label: 'Completed', variant: 'orange' },
    VERIFIED: { label: 'Verified', variant: 'emerald' },
};

export const labApi = {
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

    // Order Package lock/unlock
    lockOrderPackage: async (orderPackageId: string) => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/packages/${orderPackageId}/lock`);
        return response.data;
    },
    unlockOrderPackage: async (orderPackageId: string, reason: string) => {
        const response = await apiClient.post<ApiResponse<void>>(
            `/lab/orders/packages/${orderPackageId}/unlock`,
            { reason }
        );
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

    // Dashboard
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
    getAdminPackages: async () => {
        const response = await apiClient.get<ApiResponse<HospitalLabPackageConfigDTO[]>>('/hospital/lab/settings/packages');
        return response.data;
    },
    configureAdminPackage: async (data: HospitalLabPackageConfigDTO) => {
        const response = await apiClient.put<ApiResponse<void>>('/hospital/lab/settings/packages', data);
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
    collectPackageSamples: async (orderId: string, packageId: string) => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/packages/${packageId}/collect`, null, {
            params: { orderId }
        });
        return response.data;
    },
    markProcessing: async (orderTestId: string) => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/tests/${orderTestId}/process`);
        return response.data;
    },
    markPackageProcessing: async (orderId: string, packageId: string) => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/packages/${packageId}/process`, null, {
            params: { orderId }
        });
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
    getPackageResultBundle: async (orderId: string, packageId: string) => {
        const response = await apiClient.get<ApiResponse<LabPackageResultBundleDTO>>(`/lab/orders/packages/${packageId}/result-bundle`, {
            params: { orderId }
        });
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
    getAllPricing: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/lab/pricing');
        return response.data;
    },
    savePricing: async (data: any) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/pricing', data);
        return response.data;
    },

    // Orders
    createOrder: async (data: {
        patientId: string;
        encounterId: string;
        testIds: string[];
        packageIds: string[];
    }) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/orders', data);
        return response.data;
    },
    createWalkInOrder: async (data: {
        walkInName: string;
        walkInPhone: string;
        walkInAddress?: string;
        testIds: string[];
        packageIds: string[];
    }) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/orders/walkin', data);
        return response.data;
    },
    getQueue: async () => {
        const response = await apiClient.get<ApiResponse<any[]>>('/lab/orders/queue');
        return response.data;
    },
    saveResults: async (data: { orderTestId: string; findings?: string; results?: any[] }) => {
        const response = await apiClient.post<ApiResponse<void>>('/lab/orders/results', data);
        return response.data;
    },
    savePackageResults: async (data: {
        orderId: string;
        packageId: string;
        tests: { orderTestId: string; findings?: string; results?: any[] }[];
    }) => {
        const response = await apiClient.post<ApiResponse<void>>('/lab/orders/packages/results', data);
        return response.data;
    },
    getReportPreview: async (orderId: string) => {
        const response = await apiClient.get<ApiResponse<any>>(`/lab/reports/preview/${orderId}`);
        return response.data;
    },

    // Recommendations
    getRecommendations: async (page = 0, size = 20, search?: string) => {
        const response = await apiClient.get<ApiResponse<PageResponse<any>>>('/pharmacy/prescriptions/lab-recommendations', {
            params: { page, size, search }
        });
        return response.data;
    },
    createOrderFromRecommendation: async (data: {
        prescriptionId: string;
        testIds: string[];
        packageIds?: string[];
        paymentMode: string;
        amountPaid: number;
        referenceNumber?: string;
    }) => {
        const response = await apiClient.post<ApiResponse<any>>('/lab/orders/from-recommendation', data);
        return response.data;
    },
    verifyPackageResults: async (orderId: string, packageId: string, remarks: string, status: 'VERIFIED' | 'REJECTED') => {
        const response = await apiClient.post<ApiResponse<void>>(`/lab/orders/packages/${packageId}/verify`, null, {
            params: { orderId, remarks, status }
        });
        return response.data;
    },
};
