export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST';

export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
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

// Global User Info Types
export interface Qualification {
  degree: string;
  institution: string;
  year: number;
  specialization: string;
}

export interface DoctorEducation {
  qualifications: Qualification[];
}

export interface LanguageEntry {
  language: string;
  proficiency: 'NATIVE' | 'FLUENT' | 'INTERMEDIATE' | 'BASIC';
}

export interface ReceptionistFluency {
  fluencies: LanguageEntry[];
}

export interface DoctorInfo {
  specialization: string;
  education: DoctorEducation;
  bio: string;
  licenseNumber: string;
}

export interface NurseInfo {
  department: string;
  nursingLicenseNo: string;
  certificationLevel: 'RN' | 'LPN' | 'NP' | 'CNA';
}

export interface PharmacistInfo {
  pciRegNo: string;
  qualification: string;
}

export interface LabTechInfo {
  specialty: string;
  licenseNo: string;
}

export interface ReceptionistInfo {
  languagesSpoken: ReceptionistFluency;
  insuranceSpecialist: boolean;
}

// Role Specific Details for Memberships
export interface DoctorHospitalDetailsDTO {
  consultationFee: number;
  followUpDays: number;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: number;
  visitingConsultant: boolean;
  updatedAt: string;
}

export interface NurseHospitalDetailsDTO {
  floorLocation: string;
  shiftType: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  updatedAt: string;
}

export interface AdminHospitalDetailsDTO {
  officeLocation: string;
  departmentHead: boolean;
  updatedAt: string;
}

export interface PharmacistHospitalDetailsDTO {
  counterLocation: string;
  pharmacyWing: string;
  updatedAt: string;
}

export interface ReceptionistHospitalDetailsDTO {
  deskLocation: string;
  emergencyContactNumber: string;
  updatedAt: string;
}

export interface RoleAssignmentDTO {
  assignmentId: string;
  hospitalId?: string;
  roleCode: string;
  departmentName: string;
  active: boolean;
  doctorDetails?: DoctorHospitalDetailsDTO;
  nurseDetails?: NurseHospitalDetailsDTO;
  adminDetails?: AdminHospitalDetailsDTO;
  pharmacistDetails?: PharmacistHospitalDetailsDTO;
  receptionistDetails?: ReceptionistHospitalDetailsDTO;
}

export interface HospitalMembershipDTO {
  hospitalId: string;
  hospitalName?: string;
  hospitalCode?: string;
  roles?: string[];
  specialization?: string;
  departmentName?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  active: boolean;
  deleted?: boolean;
  superuser: boolean;
  createdAt: string;
  doctorInfo?: DoctorInfo;
  nurseInfo?: NurseInfo;
  pharmacistInfo?: PharmacistInfo;
  labTechInfo?: LabTechInfo;
  receptionistInfo?: ReceptionistInfo;
  memberships: HospitalMembershipDTO[];
  roles?: Role[]; // Computed on frontend for convenience
}

export type UserFullProfileDTO = UserResponse;

export interface UserProfileResponse extends UserResponse {
  currentHospitalId?: string | null;
  activeRole?: Role | null;
}

export interface UserRequestDTO {
  id?: string;
  username: string;
  email: string;
  password?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  superuser: boolean;
  active?: boolean;
  doctorInfo?: DoctorInfo;
  nurseInfo?: NurseInfo;
  pharmacistInfo?: PharmacistInfo;
  labTechInfo?: LabTechInfo;
  receptionistInfo?: ReceptionistInfo;
  memberships?: HospitalMembershipDTO[];
}

// Patient types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientResponse {
  id: string;
  fullName: string;
  patientCode?: string;
  gender: Gender;
  dob: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface CreatePatientRequest {
  id?: string;
  fullName: string;
  gender: Gender;
  dob: string;
  phone: string;
  address: string;
}

// Hospital types
export interface HospitalSettings {
  configurations?: Record<string, any>;
  timezone?: string;
  currency?: string;
  opdEnabled?: boolean;
  pharmacyEnabled?: boolean;
}

export interface HospitalResponse {
  id: string;
  name: string;
  code: string;
  address?: string;
  gstin?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ONBOARDING';
  settings?: HospitalSettings;
  createdAt: string;
}

export interface CreateHospitalRequest {
  id?: string;
  name: string;
  code: string;
  address?: string;
  gstin?: string;
  status?: string;
  settings?: HospitalSettings;
}

// Appointment types
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'DELAYED' | 'CANCELLED' | 'CONFIRMED' | 'CHECKED_IN';

export interface AppointmentResponse {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

// Doctor types
export interface DoctorResponse {
  id: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  specialization: string;
  department?: string;
  createdAt: string;
}

// Pharmacy types (Not fully documented in api-docs.json but needed by UI)
export interface MedicineResponse {
  id: string;
  name: string;
  composition?: string;
  manufacturer?: string;
  createdAt: string;
}

export interface PrescriptionItemResponse {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
}

export interface PrescriptionResponse {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  items: PrescriptionItemResponse[];
  status: string;
  createdAt: string;
}

// Billing types
export interface BillingItemResponse {
  id: string;
  itemName: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export interface BillingResponse {
  id: string;
  patientId: string;
  sourceType: 'OPD' | 'PHARMACY';
  status: 'DRAFT' | 'GENERATED';
  totalAmount: number;
  items: BillingItemResponse[];
  createdAt: string;
}

export interface SearchResultDTO {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
}

export interface AuditLogResponse {
  id: string;
  entityName: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'UPDATE_STATUS';
  performedBy: string;
  details?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  createdAt: string;
}
