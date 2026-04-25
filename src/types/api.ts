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

export interface EducationInfo {
  qualifications: Qualification[];
}

export interface LanguageFluency {
  language: string;
  proficiency: 'NATIVE' | 'FLUENT' | 'CONVERSATIONAL' | 'BASIC';
}

export interface LanguagesSpoken {
  fluencies: LanguageFluency[];
}

export interface DoctorInfo {
  specialization: string;
  education: EducationInfo;
  bio: string;
  licenseNumber: string;
}

export interface NurseInfo {
  department: string;
  nursingLicenseNo: string;
  certificationLevel: string;
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
  languagesSpoken: LanguagesSpoken;
  insuranceSpecialist: boolean;
}

// Role Specific Details for Memberships
export interface DoctorRoleDetails {
  consultationFee: number;
  followUpDays: number;
  commissionType: 'PERCENTAGE' | 'FLAT';
  commissionValue: number;
  visitingConsultant: boolean;
  updatedAt: string;
}

export interface NurseRoleDetails {
  floorLocation: string;
  shiftType: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  updatedAt: string;
}

export interface AdminRoleDetails {
  officeLocation: string;
  departmentHead: boolean;
  updatedAt: string;
}

export interface PharmacistRoleDetails {
  counterLocation: string;
  pharmacyWing: string;
  updatedAt: string;
}

export interface ReceptionistRoleDetails {
  deskLocation: string;
  emergencyContactNumber: string;
  updatedAt: string;
}

export interface RoleAssignmentDTO {
  assignmentId: string;
  roleCode: string;
  departmentName: string;
  active: boolean;
  doctorDetails?: DoctorRoleDetails;
  nurseDetails?: NurseRoleDetails;
  adminDetails?: AdminRoleDetails;
  pharmacistDetails?: PharmacistRoleDetails;
  receptionistDetails?: ReceptionistRoleDetails;
}

export interface DetailedHospitalMembershipDTO {
  hospitalId: string;
  hospitalName?: string;
  hospitalCode?: string;
  roleAssignments: RoleAssignmentDTO[];
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
  deleted: boolean;
  superuser: boolean;
  createdAt: string;
  doctorInfo?: DoctorInfo;
  nurseInfo?: NurseInfo;
  pharmacistInfo?: PharmacistInfo;
  labTechInfo?: LabTechInfo;
  receptionistInfo?: ReceptionistInfo;
  detailedMemberships: DetailedHospitalMembershipDTO[];
  roles?: Role[]; // Computed on frontend
}

export type UserFullProfileDTO = UserResponse;

// Re-use same structure for Profile Response (used in /me)
export interface UserProfileResponse extends UserResponse {
  // Frontend computed fields if any
  currentHospitalId?: string | null;
  activeRole?: Role | null;
}

export interface UserRequestDTO {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  superuser: boolean;
  active?: boolean;
  memberships?: HospitalMembershipResponse[];
  doctorInfo?: DoctorInfo;
  nurseInfo?: NurseInfo;
  pharmacistInfo?: PharmacistInfo;
  labTechInfo?: LabTechInfo;
  receptionistInfo?: ReceptionistInfo;
  detailedMemberships?: DetailedHospitalMembershipDTO[];
}

// Patient types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientResponse {
  id: string;
  fullName: string;
  gender: Gender;
  dob: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface CreatePatientRequest {
  fullName: string;
  gender: Gender;
  dob: string;
  phone: string;
  address: string;
}

// Hospital types
export interface HospitalResponse {
  id: string;
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

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface SelectHospitalRequest {
  hospitalId: string;
}

// Appointment types
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'DELAYED' | 'CANCELLED';

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization?: string;
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

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
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
  department?: string;
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
  status: string;
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
