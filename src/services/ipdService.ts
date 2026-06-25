import apiClient from './apiClient';
import { ApiResponse, PageResponse } from '@/types/api';
import { WardDTO, BedDTO, AdmissionRequestDTO, AdmissionResponseDTO, AdmissionStatus, TransferBedRequest, BedTransferResponse, ProgressNoteRequestDTO, ProgressNoteResponseDTO } from '@/types/ipd';

export const ipdService = {
  // Ward APIs
  async createWard(request: WardDTO): Promise<ApiResponse<WardDTO>> {
    const response = await apiClient.post<ApiResponse<WardDTO>>('/ipd/wards', request);
    return response.data;
  },

  async listWards(params: { page?: number; size?: number } = {}): Promise<ApiResponse<PageResponse<WardDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<WardDTO>>>('/ipd/wards', { params });
    return response.data;
  },

  async getWard(id: string): Promise<ApiResponse<WardDTO>> {
    const response = await apiClient.get<ApiResponse<WardDTO>>(`/ipd/wards/${id}`);
    return response.data;
  },

  async updateWard(id: string, request: WardDTO): Promise<ApiResponse<WardDTO>> {
    const response = await apiClient.put<ApiResponse<WardDTO>>(`/ipd/wards/${id}`, request);
    return response.data;
  },

  async listWardBeds(wardId: string): Promise<ApiResponse<BedDTO[]>> {
    const response = await apiClient.get<ApiResponse<BedDTO[]>>(`/ipd/wards/${wardId}/beds`);
    return response.data;
  },

  // Bed APIs
  async createBed(request: BedDTO): Promise<ApiResponse<BedDTO>> {
    const response = await apiClient.post<ApiResponse<BedDTO>>('/ipd/beds', request);
    return response.data;
  },

  async listBeds(params: { page?: number; size?: number } = {}): Promise<ApiResponse<PageResponse<BedDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BedDTO>>>('/ipd/beds', { params });
    return response.data;
  },

  async getBed(id: string): Promise<ApiResponse<BedDTO>> {
    const response = await apiClient.get<ApiResponse<BedDTO>>(`/ipd/beds/${id}`);
    return response.data;
  },

  async updateBed(id: string, request: BedDTO): Promise<ApiResponse<BedDTO>> {
    const response = await apiClient.put<ApiResponse<BedDTO>>(`/ipd/beds/${id}`, request);
    return response.data;
  },

  // Admission APIs
  async admitPatient(request: AdmissionRequestDTO): Promise<ApiResponse<AdmissionResponseDTO>> {
    const response = await apiClient.post<ApiResponse<AdmissionResponseDTO>>('/ipd/admissions', request);
    return response.data;
  },

  async listAdmissions(params: { page?: number; size?: number } = {}): Promise<ApiResponse<PageResponse<AdmissionResponseDTO>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AdmissionResponseDTO>>>('/ipd/admissions', { params });
    return response.data;
  },

  async getAdmission(id: string): Promise<ApiResponse<AdmissionResponseDTO>> {
    const response = await apiClient.get<ApiResponse<AdmissionResponseDTO>>(`/ipd/admissions/${id}`);
    return response.data;
  },

  async updateAdmissionStatus(id: string, status: AdmissionStatus): Promise<ApiResponse<AdmissionResponseDTO>> {
    const response = await apiClient.patch<ApiResponse<AdmissionResponseDTO>>(`/ipd/admissions/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },
  
  async transferBed(admissionId: string, request: TransferBedRequest): Promise<ApiResponse<BedTransferResponse>> {
    const response = await apiClient.post<ApiResponse<BedTransferResponse>>(`/ipd/admissions/${admissionId}/transfer`, request);
    return response.data;
  },

  async getBedTransfers(admissionId: string): Promise<ApiResponse<BedTransferResponse[]>> {
    const response = await apiClient.get<ApiResponse<BedTransferResponse[]>>(`/ipd/admissions/${admissionId}/transfers`);
    return response.data;
  },

  async getMyPatients(): Promise<ApiResponse<AdmissionResponseDTO[]>> {
    const response = await apiClient.get<ApiResponse<AdmissionResponseDTO[]>>('/ipd/doctor/my-patients');
    return response.data;
  },

  async getProgressNotes(admissionId: string): Promise<ApiResponse<ProgressNoteResponseDTO[]>> {
    const response = await apiClient.get<ApiResponse<ProgressNoteResponseDTO[]>>(`/ipd/admissions/${admissionId}/progress-notes`);
    return response.data;
  },

  async createProgressNote(admissionId: string, request: ProgressNoteRequestDTO): Promise<ApiResponse<ProgressNoteResponseDTO>> {
    const response = await apiClient.post<ApiResponse<ProgressNoteResponseDTO>>(`/ipd/admissions/${admissionId}/progress-notes`, request);
    return response.data;
  }
};
