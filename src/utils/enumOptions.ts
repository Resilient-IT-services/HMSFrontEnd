import type {
  AppointmentStatus,
  AuditEntityName,
  BloodGroup,
  DayOfWeek,
  DoctorAvailabilityExceptionType,
  Gender,
  InventoryUnit,
  InvoiceItemCategory,
  InvoiceStatus,
  MedicineForm,
  MedicineScheduleType,
  PharmacySaleStatus,
  PharmacySaleType,
  PrescriptionStatus,
  Role,
  SourceType,
  StockTransactionType,
  UserAccountStatus,
  VitalRangeConfigDTO
} from '@/types/api';

type Option<T extends string> = { value: T; label: string };

export const ROLE_OPTIONS: Option<Role>[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'LAB_TECHNICIAN', label: 'Lab Technician' }
];

export const USER_ACCOUNT_STATUS_OPTIONS: Option<UserAccountStatus>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' }
];

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' }
];

export const BLOOD_GROUP_OPTIONS: Option<BloodGroup>[] = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' }
];

export const DAY_OF_WEEK_OPTIONS: Option<DayOfWeek>[] = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' }
];

export const DOCTOR_AVAILABILITY_EXCEPTION_TYPE_OPTIONS: Option<DoctorAvailabilityExceptionType>[] = [
  { value: 'FULL_DAY_OFF', label: 'Full Day Off' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'ADDED', label: 'Added' }
];

export const APPOINTMENT_STATUS_OPTIONS: Option<AppointmentStatus>[] = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'VITALS_RECORDED', label: 'Vitals Recorded' },
  { value: 'CONSULTATION_STARTED', label: 'Consultation Started' },
  { value: 'PRESCRIPTION_FINALIZED', label: 'Prescription Finalized' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export const PRESCRIPTION_STATUS_OPTIONS: Option<PrescriptionStatus>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DISPENSED', label: 'Dispensed' }
];

export const MEDICINE_FORM_OPTIONS: Option<MedicineForm>[] = [
  { value: 'TABLET', label: 'Tablet' },
  { value: 'SYRUP', label: 'Syrup' },
  { value: 'INJECTION', label: 'Injection' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'OINTMENT', label: 'Ointment' },
  { value: 'CREAM', label: 'Cream' },
  { value: 'DROPS', label: 'Drops' },
  { value: 'INHALER', label: 'Inhaler' }
];

export const MEDICINE_SCHEDULE_OPTIONS: Option<MedicineScheduleType>[] = [
  { value: 'OTC', label: 'OTC' },
  { value: 'SCHEDULE_H', label: 'Schedule H' },
  { value: 'SCHEDULE_G', label: 'Schedule G' },
  { value: 'SCHEDULE_X', label: 'Schedule X' }
];

export const PHARMACY_SALE_TYPE_OPTIONS: Option<PharmacySaleType>[] = [
  { value: 'WALKIN', label: 'Walk-in' },
  { value: 'VISIT', label: 'Patient Visit' }
];

export const PHARMACY_SALE_STATUS_OPTIONS: Option<PharmacySaleStatus>[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export const INVENTORY_UNIT_OPTIONS: Option<InventoryUnit>[] = [
  { value: 'PIECE', label: 'Piece' },
  { value: 'BOX', label: 'Box' },
  { value: 'STRIP', label: 'Strip' },
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'PACK', label: 'Pack' },
  { value: 'VIAL', label: 'Vial' },
  { value: 'AMPULE', label: 'Ampule' }
];

export const SOURCE_TYPE_OPTIONS: Option<SourceType>[] = [
  { value: 'APPOINTMENT', label: 'Appointment' },
  { value: 'PHARMACY_SALE_ITEM', label: 'Pharmacy Sale Item' },
  { value: 'LAB_ORDER', label: 'Lab Order' }
];

export const INVOICE_STATUS_OPTIONS: Option<InvoiceStatus>[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export const INVOICE_ITEM_CATEGORY_OPTIONS: Option<InvoiceItemCategory>[] = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'LAB', label: 'Lab' },
  { value: 'PROCEDURE', label: 'Procedure' }
];

export const STOCK_TRANSACTION_TYPE_OPTIONS: Option<StockTransactionType>[] = [
  { value: 'STOCK_IN', label: 'Stock In' },
  { value: 'STOCK_OUT', label: 'Stock Out' },
  { value: 'RETURN', label: 'Return' },
  { value: 'ADJUSTMENT', label: 'Adjustment' }
];

export const AUDIT_ENTITY_NAME_OPTIONS: Option<AuditEntityName>[] = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'APPOINTMENT', label: 'Appointment' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'MEDICINE', label: 'Medicine' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'USER_ACCOUNT', label: 'User Account' },
  { value: 'USER_CONTRACT', label: 'User Contract' }
];

export const VITAL_TYPE_OPTIONS: Option<VitalRangeConfigDTO['vitalType']>[] = [
  { value: 'BODY_TEMPERATURE', label: 'Body Temperature' },
  { value: 'SYSTOLIC_BP', label: 'Systolic BP' },
  { value: 'DIASTOLIC_BP', label: 'Diastolic BP' },
  { value: 'OXYGEN_LEVEL', label: 'Oxygen Level' },
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'HEART_RATE', label: 'Heart Rate' }
];
