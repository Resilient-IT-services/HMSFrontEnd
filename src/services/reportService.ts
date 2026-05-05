import apiClient from './apiClient';
import { ApiResponse, DoctorStaffResponse, PageResponse } from '@/types/api';

export type ReportType = 'DOCTOR_REVENUE' | 'PAYMENT_SUMMARY';
export type ReportRow = Record<string, unknown>;

export interface ReportFilters {
  type: ReportType;
  startDate: string;
  endDate: string;
  hospitalId?: string;
  doctorId?: string;
}

const buildParams = ({ type, startDate, endDate, doctorId }: ReportFilters) => ({
  type,
  startDate,
  endDate,
  ...(doctorId ? { doctorId } : {})
});

const buildConfig = (filters: ReportFilters) => ({
  params: buildParams(filters),
  ...(filters.hospitalId ? { headers: { 'X-Hospital-Id': filters.hospitalId } } : { skipHospitalHeader: true })
});

export const reportService = {
  async preview(filters: ReportFilters): Promise<ApiResponse<ReportRow[]>> {
    const response = await apiClient.get<ApiResponse<ReportRow[]>>('/reports/preview', buildConfig(filters));
    return response.data;
  },

  async exportPdf(filters: ReportFilters): Promise<Blob> {
    const response = await apiClient.get<Blob>('/reports/export/pdf', {
      ...buildConfig(filters),
      responseType: 'blob'
    });
    return response.data;
  },

  async exportExcel(filters: ReportFilters): Promise<Blob> {
    const response = await apiClient.get<Blob>('/reports/export/excel', {
      ...buildConfig(filters),
      responseType: 'blob'
    });
    return response.data;
  },

  async listDoctors(hospitalId?: string): Promise<ApiResponse<PageResponse<DoctorStaffResponse>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<DoctorStaffResponse>>>('/staff/doctors', {
      params: { page: 0, size: 500 },
      ...(hospitalId ? { headers: { 'X-Hospital-Id': hospitalId } } : { skipHospitalHeader: true })
    });
    return response.data;
  }
};
