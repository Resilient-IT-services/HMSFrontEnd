export type WardType = 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'ICU';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'CANCELLED';

export interface WardDTO {
  id?: string;
  wardCode: string;
  wardName: string;
  wardType: WardType;
  totalBeds: number;
  active: boolean;
  remarks?: string;
}

export interface BedDTO {
  id?: string;
  wardId: string;
  bedNumber: string;
  status: BedStatus;
  active: boolean;
  wardName?: string;
}

export interface AdmissionRequestDTO {
  patientId: string;
  doctorId: string;
  bedId: string;
  admissionReason?: string;
  remarks?: string;
}

export interface AdmissionResponseDTO {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  bedId: string;
  bedNumber: string;
  wardName: string;
  admissionDateTime: string;
  status: AdmissionStatus;
  admissionReason?: string;
  remarks?: string;
}

export interface TransferBedRequest {
  toBedId: string;
  transferReason?: string;
  remarks?: string;
}

export interface BedTransferResponse {
  id: string;
  admissionId: string;
  fromBedId: string;
  fromBedNumber: string;
  fromWardName: string;
  toBedId: string;
  toBedNumber: string;
  toWardName: string;
  transferReason?: string;
  remarks?: string;
  transferredBy: string;
  transferredByName?: string;
  transferredAt: string;
}

export interface ProgressNoteRequestDTO {
  note: string;
}

export interface ProgressNoteResponseDTO {
  id: string;
  hospitalId: string;
  admissionId: string;
  doctorId: string;
  doctorName: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

