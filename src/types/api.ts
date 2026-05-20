export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LAB_TECHNICIAN';
export type UserAccountStatus = 'ACTIVE' | 'INACTIVE';

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
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';
export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';
export type DoctorAvailabilityExceptionType = 'FULL_DAY_OFF' | 'MODIFIED' | 'ADDED';
export type MedicineForm = 'TABLET' | 'SYRUP' | 'INJECTION' | 'CAPSULE' | 'OINTMENT' | 'CREAM' | 'DROPS' | 'INHALER';
export type MedicineScheduleType = 'SCHEDULE_H' | 'SCHEDULE_G' | 'SCHEDULE_X' | 'OTC';
export type PharmacySaleType = 'VISIT' | 'WALKIN';
export type PharmacySaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';
export type InventoryUnit = 'PIECE' | 'BOX' | 'STRIP' | 'BOTTLE' | 'PACK' | 'VIAL' | 'AMPULE';
export type SourceType = 'APPOINTMENT' | 'PHARMACY_SALE_ITEM' | 'LAB_ORDER';
export type AuditEntityName =
  | 'PATIENT'
  | 'APPOINTMENT'
  | 'INVOICE'
  | 'PAYMENT'
  | 'PRESCRIPTION'
  | 'MEDICINE'
  | 'HOSPITAL'
  | 'USER_ACCOUNT'
  | 'USER_CONTRACT';
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPENSED';

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
  specialization?: string; // UI compatibility
  specializations: string[];
  education: DoctorEducation;
  bio: string;
  licenseNumber: string;
  registrationNumber?: string;
  experienceYears?: number;
  awards?: string[];
  languages?: string[];
  signature?: string;
  consultationFee?: number;
  metadata?: Record<string, unknown>;
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
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotDurationMinutes: number;
  maxPatients: number;
}

export interface AvailabilityExceptionDTO {
  id?: string;
  date: string; // YYYY-MM-DD
  type: DoctorAvailabilityExceptionType;
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
  departments: string[];
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
  status?: UserAccountStatus;
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
  status?: UserAccountStatus;
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
  bloodGroup?: BloodGroup;
  address: string;
  createdAt: string;
}

export interface PatientSummaryDTO {
  id: string;
  fullName: string;
  patientCode: string;
  gender: Gender;
  phone: string;
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
  bloodGroup?: BloodGroup;
  medicalHistory?: string;
}

export type ReportType = 'DOCTOR_REVENUE' | 'PHARMACY_REVENUE' | 'PAYMENT_SUMMARY' | 'PAYMENT_COLLECTOR_SUMMARY';

export interface OPDPaymentInfo {
  amount: number;
  mode: 'CASH' | 'CARD' | 'UPI' | 'NEFT' | 'INSURANCE';
  referenceNumber?: string;
}

export interface OPDEncounterRequest {
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  notes?: string;
  payment?: OPDPaymentInfo;
}

// ... other types ...

export interface UpdateBillingStatusRequest {
  status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  paymentMethod?: string;
  discount?: number;
}

export interface PatientDashboardStatsDTO {
  totalRecords: number;
  newToday: number;
  inPatient: number;
}

// Hospital types
export interface HospitalSettings {
  configurations?: Record<string, unknown>;
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
  departments?: string[];
  timezone: string;
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
  departments?: string[];
  timezone: string;
}

// Appointment types
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'VITALS_RECORDED'
  | 'CONSULTATION_STARTED'
  | 'PRESCRIPTION_FINALIZED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface VitalsDTO {
  bloodPressure: string; // Combined for legacy or display
  systolic?: number;
  diastolic?: number;
  heartRate: number;
  temperature: number;
  weight: number;
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
  visitId?: string;
  prescription?: PrescriptionDTO;
  createdAt: string;
}

export interface AppointmentSummaryDTO {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientGender?: Gender;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentTime: string;
  status: AppointmentStatus;
  tokenNumber: number;
  visitId?: string;
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
  departments: string[];
  specializations: string[];
  consultationFee: number;
}

export interface NurseStaffResponse {
  userId: string;
  nurseId: string;
  assignmentId: string;
  fullName: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  departments: string[];
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
  form?: MedicineForm;
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
  scheduleType?: MedicineScheduleType;
  /** @deprecated use scheduleType */
  scheduleDrug?: string;
  /** @deprecated use scheduleType */
  scheduledType?: string;
}

export type MedicineRequestDTO = Omit<MedicineResponse, 'id'> & { id?: string };

export interface MedicineSummaryDTO {
  id: string;
  name: string;
  genericName?: string;
  composition?: string;
  strength?: string;
  form?: MedicineForm;
  category?: string;
  manufacturer?: string;
  currentStock?: number;
}

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
  manufacturingDate?: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplier?: string;
  gst?: number;
  rackLocation?: string;
}

export interface PharmacySaleItem {
  medicineId: string;
  quantity: number;
}

export interface PharmacySaleRequest {
  patientId?: string;
  prescriptionId?: string;
  visitId?: string;
  items: PharmacySaleItem[];
}

export interface QuickPharmacySaleRequest {
  saleType: PharmacySaleType;
  patientId?: string;
  visitId?: string;
  prescriptionId?: string;
  doctorId?: string;
  externalDoctorName?: string;
  customerName?: string;
  customerPhone?: string;
  items: PharmacySaleItem[];
  payment?: {
    mode: 'CASH' | 'CARD' | 'UPI' | 'NEFT' | 'INSURANCE';
    amount: number;
    referenceNumber?: string;
  };
  notes?: string;
}

export interface QuickPharmacySaleItem {
  id?: string;
  medicineId: string;
  medicineName?: string;
  batchNumber?: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
  netAmount?: number;
}

export interface QuickPharmacySaleResponse {
  saleId: string;
  saleNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  status: PharmacySaleStatus;
  paymentId?: string;
  receiptNumber?: string;
  customerName?: string;
  customerPhone?: string;
  externalDoctorName?: string;
  createdAt: string;
  items: QuickPharmacySaleItem[];
}

export interface PharmacySaleResponse {
  id: string;
  patientId?: string;
  prescriptionId?: string;
  visitId?: string;
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
  unit: InventoryUnit;
  currentStock: number;
  createdAt: string;
}

export interface InventoryItemRequestDTO {
  name: string;
  category: string;
  unit: InventoryUnit;
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
  patientCode?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  visitId?: string;
  items: PrescriptionItemDTO[];
  status?: PrescriptionStatus;
  createdAt?: string;
}

export interface PrescriptionSummaryDTO {
  id: string;
  patientId: string;
  patientName: string;
  patientCode?: string;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  visitId?: string;
  status: PrescriptionStatus;
  createdAt: string;
  itemCount: number;
}
// Legacy aliases
export type PrescriptionItemResponse = PrescriptionItemDTO;
export type PrescriptionResponse = PrescriptionDTO;


// Finance types
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type InvoiceItemCategory = 'CONSULTATION' | 'PHARMACY' | 'LAB' | 'PROCEDURE';

export interface InvoiceItemDTO {
  id: string;
  itemDescription: string;
  category: InvoiceItemCategory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  netTotal: number;
  sourceType: SourceType;
  sourceId: string;
  doctorId?: string;
  doctorName?: string;
}

export interface InvoiceDTO {
  id: string;
  patientId: string;
  patientName?: string;
  visitId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotalAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate?: string;
  createdAt: string;
  items: InvoiceItemDTO[];
}

export interface PaymentDTO {
  id: string;
  hospitalId: string;
  patientId: string;
  visitId?: string;
  amount: number;
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'NEFT' | 'INSURANCE';
  referenceNumber?: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  paymentDate: string;
  collectedBy: string;
  receiptNumber: string;
}

export interface RecordPaymentRequest {
  patientId: string;
  visitId?: string;
  amount: number;
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'NEFT' | 'INSURANCE';
  referenceNumber?: string;
  invoiceId?: string;
}

// Legacy compatibility (to be removed)
export type BillingDTO = InvoiceDTO;
export type BillingItemDTO = InvoiceItemDTO;
export type BillingResponse = InvoiceDTO;

// Audit types
export interface AuditDetail {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditLogResponse {
  id: string;
  entityName: AuditEntityName;
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

export interface PatientHistorySummaryDTO {
  patient: PatientSummaryDTO;
  visits: AppointmentSummaryDTO[];
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
  upcoming: number;
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
}

export interface VitalRangeConfigDTO {
  id: string;
  vitalType: 'BODY_TEMPERATURE' | 'SYSTOLIC_BP' | 'DIASTOLIC_BP' | 'OXYGEN_LEVEL' | 'WEIGHT' | 'HEART_RATE';
  minValue: number;
  maxValue: number;
}

export type VitalRangesResponse = Record<string, VitalRange>;

export interface Department {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Specialization {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

// User Summary
export interface DoctorSelectionDTO {
  id: string;
  fullName: string;
  specialization: string;
  consultationFee:number;
}

export interface ApiResponseListDoctorSelectionDTO {
  success: boolean;
  data?: DoctorSelectionDTO[];
  error?: ApiError;
}

export interface HospitalSelectionDTO {
  id: string;
  name: string;
}

export interface ApiResponseListHospitalSelectionDTO {
  success: boolean;
  data?: HospitalSelectionDTO[];
  error?: ApiError;
}

export interface AdminStatsDTO {
  totalUsers: number;
  activeUsers: number;
  totalHospitals: number;
  totalDoctors: number;
}

export interface ApiResponseAdminStatsDTO {
  success: boolean;
  data?: AdminStatsDTO;
  error?: ApiError;
}

export interface DoctorRevenueSummaryDTO {
  totalAppointments: number;
  totalRevenue: number;
  averageFee: number;
}

export interface ApiResponseDoctorRevenueSummaryDTO {
  success: boolean;
  data?: DoctorRevenueSummaryDTO;
  error?: ApiError;
}

export interface UserSummaryDTO {
  id: string;
  username: string;
  email: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  phone: string;
  active: boolean;
  status?: UserAccountStatus;
  deleted?: boolean;
  superuser: boolean;
  memberships: HospitalMembershipDTO[];
}
