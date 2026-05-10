export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LAB_TECHNICIAN';

export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type LocalTime = string;

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
  id?: string;
  specialization: string;
  education: DoctorEducation;
  bio: string;
  licenseNumber: string;
}

export interface NurseInfo {
  id?: string;
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
export interface ScheduleDTO {
  id?: string;
  dayOfWeek: number; // 1-7 (Mon-Sun)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotDurationMinutes: number;
  maxPatients: number;
}

export interface AvailabilityExceptionDTO {
  id?: string;
  date: string; // YYYY-MM-DD
  type: string; // "VACATION", "SICK_LEAVE", "EXTRA_HOURS", "BREAK"
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  mode: string; // "AVAILABLE", "UNAVAILABLE"
  slotDurationMinutes?: number;
  note?: string;
}

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
  pharmacyLicenseNo?: string;
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
  schedules?: ScheduleDTO[];
  availabilityExceptions?: AvailabilityExceptionDTO[];
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
  roles?: string[]; // Direct roles array found in API response
  roleAssignments?: RoleAssignmentDTO[];
}

export interface UserResponse {
  id: string; // userId
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

export type User = UserProfileResponse;

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

export interface AdminResetPasswordRequest {
  newPassword: string;
}

// Patient types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface PatientResponse {
  id: string; // patientId
  fullName: string;
  patientCode?: string;
  email?: string;
  medicalHistory?: string;
  gender: Gender;
  dob: string;
  phone: string;
  bloodGroup?: string;
  address: string;
  createdAt: string;
}

export interface CreatePatientRequest {
  id?: string;
  fullName: string;
  patientCode?: string;
  email?: string;
  gender: Gender;
  dob: string;
  phone: string;
  address: string;
  bloodGroup?: string;
  medicalHistory?: string;
}

// ... other types ...

export interface UpdateBillingStatusRequest {
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'PARTIALLY_PAID';
  paymentMethod?: string;
  discount?: number;
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
  id: string; // hospitalId
  name: string;
  code: string;
  hospitalCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  registrationNo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ONBOARDING';
  settings?: HospitalSettings;
  createdAt: string;
}

export interface CreateHospitalRequest {
  id?: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  registrationNo?: string;
  status?: string;
  settings?: HospitalSettings;
}

// Appointment types
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'PAYMENT_PENDING' | 'WAITING_FOR_VITALS' | 'WALK_IN' | 'CANCELLED' | 'ADD_VITALS' | 'CHECKED_IN';

export interface VitalsDTO {
  bloodPressure: string; // Combined for legacy or display
  systolic?: number;
  diastolic?: number;
  heartRate: number;
  pulseRate?: number;
  temperature: number;
  temperatureUnit?: 'CELSIUS' | 'FAHRENHEIT';
  weight: number;
  weightUnit?: 'KG' | 'LB';
  oxygenLevel?: number;
  respiratoryRate?: number;
}

export interface AppointmentResponse {
  id: string; // appointmentId
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: Gender;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  appointmentTime: string;
  timeSlot?: string;
  sessionPeriod?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  status: AppointmentStatus;
  tokenNumber?: number;
  tokenDisplay?: string;
  chiefComplaints?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  icdCodes?: string[];
  notes?: string;
  vitals?: VitalsDTO;
  prescription?: PrescriptionDTO;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  id?: string;
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  notes?: string;
  status?: AppointmentStatus;
  sessionPeriod?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  vitals?: VitalsDTO;
  chiefComplaints?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  icdCodes?: string[];
  prescription?: PrescriptionDTO;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

// Availability types
export interface SessionInfo {
  scheduleId?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  maxPatients: number;
  currentBookings: number;
  available: boolean;
  nextSuggestedTime?: string; // HH:mm
}

export interface DoctorAvailabilityResponse {
  sessions: SessionInfo[];
}

// Staff types
export interface DoctorStaffResponse {
  userId: string;
  doctorId: string;
  assignmentId: string;
  fullName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  departmentName: string;
  specialization: string;
  consultationFee: number;
}

export interface NurseStaffResponse {
  userId: string;
  nurseId: string;
  assignmentId: string;
  fullName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  departmentName: string;
  certificationLevel: 'RN' | 'LPN' | 'NP' | 'CNA';
  shiftType: 'DAY' | 'NIGHT' | 'ROTATIONAL';
}

// Doctor types (Legacy - used by some components)
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

// Pharmacy types
export interface MedicineResponse {
  id: string;
  name: string;
  genericName?: string;
  composition?: string;
  strength?: string;
  form?: string; // mapping from category
  category?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  currentStock?: number;
  reorderLevel?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  taxPercentage?: number;
  temperature?: string;
  humidity?: string;
  specialNotes?: string;
  scheduleType?: string; // Correct field from API
  /** @deprecated use scheduleType */
  scheduleDrug?: string;
  /** @deprecated use scheduleType */
  scheduledType?: string;
}

export type MedicineRequestDTO = Omit<MedicineResponse, 'id'> & { id?: string };

export interface PharmacyStockDTO {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  composition?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  totalQuantity?: number;
  price: number;
  purchasePrice?: number;
  sellingPrice?: number;
}

export interface StockRequest {
  medicineId: string;
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface PharmacySaleItem {
  medicineId: string;
  quantity: number;
}

export interface PharmacySaleRequest {
  patientId?: string;
  prescriptionId?: string;
  items: PharmacySaleItem[];
}

export interface PharmacySaleResponse {
  id: string;
  patientId?: string;
  prescriptionId?: string;
  totalAmount: number;
  items: PharmacySaleItem[];
}

export interface PharmacyReturnRequest {
  saleItemId: string;
  quantity: number;
  reason?: string;
}

export interface PharmacyReturnResponse {
  id: string;
  saleItemId: string;
  stockId: string;
  quantity: number;
  reason?: string;
}

export interface InventoryStockDTO {
  itemId: string;
  itemName: string;
  quantity: number;
  lastUpdated: string;
}

export interface InventoryItemResponse {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  createdAt: string;
}

export interface InventoryItemRequestDTO {
  name: string;
  category: string;
  unit: string;
}

export type StockTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'RETURN' | 'ADJUSTMENT';

export interface StockTransactionRequestDTO {
  itemId: string;
  type: StockTransactionType;
  quantity: number;
  reference?: string;
}

export interface PrescriptionItemDTO {
  id?: string;
  medicineId?: string;
  medicineName: string;
  dosage: string;
  duration: string;
}

export interface PrescriptionDTO {
  id?: string;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  items: PrescriptionItemDTO[];
  status?: string;
  createdAt?: string;
}

// Legacy aliases
export type PrescriptionItemResponse = PrescriptionItemDTO;
export type PrescriptionResponse = PrescriptionDTO;


// Billing types
export interface BillingItemDTO {
  id?: string;
  itemName: string;
  amount: number;
  quantity: number;
  subtotal: number;
}

export interface BillingDTO {
  id?: string;
  patientId: string;
  patientName?: string;
  appointmentId?: string;
  sourceType: 'OPD' | 'IPD' | 'PHARMACY' | 'LAB' | 'EMERGENCY' | 'APPOINTMENT';
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'PARTIALLY_PAID';
  totalAmount: number;
  discount?: number;
  paymentMethod?: string;
  createdAt?: string;
  items: BillingItemDTO[];
}

// Legacy aliases
export type BillingItemResponse = BillingItemDTO;
export type BillingResponse = BillingDTO;

// Audit types
export interface AuditDetail {
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export interface AuditLogResponse {
  id: string;
  entityName: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'UPDATE_STATUS';
  performedBy: string;
  details?: AuditDetail;
  createdAt: string;
}

// Search types
export interface SearchResultDTO {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  link: string;
}

// Patient History
export interface PatientHistoryDTO {
  patient: PatientResponse;
  visits: AppointmentResponse[];
}

// Doctor Slot
export interface DoctorSlotDTO {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
  status?: string;
}

// Appointment Stats
export interface AppointmentStatsDTO {
  total: number;
  byStatus: Record<string, number>;
}

// Vital Settings
export interface VitalSetting {
  id?: string;
  hospitalId?: string;
  vitalName: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VitalRange {
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface VitalRangeConfigDTO {
  id: string;
  vitalType: 'BODY_TEMPERATURE' | 'SYSTOLIC_BP' | 'DIASTOLIC_BP' | 'OXYGEN_LEVEL' | 'WEIGHT' | 'HEART_RATE';
  minValue: number;
  maxValue: number;
  unit: string;
}

export type VitalRangesResponse = Record<string, VitalRange>;

// User Summary
export interface UserSummaryDTO {
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
  memberships: HospitalMembershipDTO[];
}
