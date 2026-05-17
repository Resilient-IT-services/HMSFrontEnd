import { AppointmentStatus } from '@/types/api';

export const APPOINTMENT_STATUS_METADATA: Record<AppointmentStatus, { label: string; variant: 'slate' | 'blue' | 'orange' | 'emerald' | 'red' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'orange' },
  COMPLETED: { label: 'Completed', variant: 'emerald' },
  PAYMENT_PENDING: { label: 'Payment Pending', variant: 'orange' },
  WAITING_FOR_VITALS: { label: 'Waiting for Vitals', variant: 'orange' },
  WALK_IN: { label: 'In Progress', variant: 'blue' },
  CANCELLED: { label: 'Cancelled', variant: 'red' },
  ADD_VITALS: { label: 'Add Vitals', variant: 'orange' },
  CHECKED_IN: { label: 'Checked In', variant: 'orange' },
};

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_DEBOUNCE_MS = 300;
export const DASHBOARD_REFRESH_INTERVAL = 30000;
export const MOBILE_BREAKPOINT = 1024;

export const ROLE_PATH_MAP: Record<string, string> = {
  'RECEPTIONIST': 'reception',
  'DOCTOR': 'doctor',
  'PHARMACIST': 'pharmacy',
  'ADMIN': 'admin',
  'SUPER_ADMIN': 'super_admin',
  'NURSE': 'nurse'
};

export const LOW_STOCK_THRESHOLD = 10;
export const EXPIRY_ALERT_DAYS = 30;
export const CHART_DEFAULT_MIN_HEIGHT = 300;
export const CHART_VALUE_SCALE = 1;
