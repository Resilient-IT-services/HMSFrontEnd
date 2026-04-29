import apiClient from './apiClient';
import { ApiResponse, PageResponse, AuditLogResponse } from '@/types/api';

export const auditService = {
  async list(page = 0, size = 20): Promise<ApiResponse<PageResponse<AuditLogResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AuditLogResponse>>>('/audit-logs', {
      params: { page, size }
    });
    return response.data;
  }
};
