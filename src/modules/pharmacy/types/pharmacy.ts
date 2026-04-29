import { PrescriptionDTO, PatientResponse, AppointmentResponse } from '@/types/api';

export interface PrescriptionItem extends PrescriptionDTO {
  medicineName: string;
  dosage: string;
  duration: string;
  notes?: string;
  inStock?: number;
  unitPrice?: number;
}

export interface PharmacyPrescription extends PrescriptionDTO {
  status: 'PENDING' | 'DISPENSED' | 'COMPLETED' | 'CANCELLED';
  totalMedicines?: number;
}

export interface PatientHistory {
  appointments: AppointmentResponse[];
  prescriptions: PrescriptionDTO[];
  diagnoses: string[];
  medicineHistory: string[];
}
