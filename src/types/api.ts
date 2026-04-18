export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST';

export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// User types
export interface UserProfile {
  userId: number;
  hospitalId: number;
  username: string;
  role: Role;
}

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

// Patient types
export interface PatientResponse {
  id: number;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  address: string;
  createdAt: string;
}

// Hospital types
export interface HospitalResponse {
  id: number;
  name: string;
  code: string;
  address?: string;
  status: string;
  createdAt: string;
}

export interface CreateHospitalRequest {
  name: string;
  code: string;
  address?: string;
}

export interface CreateUserRequest {
  username: string;
  password?: string;
  role: Role;
  hospitalId: number;
}

// Appointment types
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'DELAYED' | 'CANCELLED';

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentTime: string;
  notes?: string;
}

// Doctor types
export interface DoctorResponse {
  id: number;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  specialization: string;
  createdAt: string;
}

// Pharmacy types
export interface MedicineResponse {
  id: number;
  name: string;
  composition?: string;
  manufacturer?: string;
  createdAt: string;
}

export interface PrescriptionItemResponse {
  id: number;
  medicineId: number;
  medicineName: string;
  dosage: string;
  duration: string;
}

export interface PrescriptionResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  items: PrescriptionItemResponse[];
  createdAt: string;
}

// Billing types
export interface BillingItemResponse {
  id: number;
  itemName: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export interface BillingResponse {
  id: number;
  patientId: number;
  sourceType: 'OPD' | 'PHARMACY';
  status: 'DRAFT' | 'GENERATED';
  totalAmount: number;
  items: BillingItemResponse[];
  createdAt: string;
}
