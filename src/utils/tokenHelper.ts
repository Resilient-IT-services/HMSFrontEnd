import { AppointmentResponse, AppointmentSummaryDTO } from '@/types/api';

/**
 * Formats a token for display.
 * Priority: 
 * 1. backend tokenDisplay (e.g., "T-001")
 * 2. calculated display from tokenNumber (e.g., "T-001")
 * 3. Fallback placeholder
 */
export const formatToken = (appointment: AppointmentResponse | AppointmentSummaryDTO | undefined | null): string => {
  if (!appointment) return '---';
  
  if ('tokenDisplay' in appointment && appointment.tokenDisplay) {
    return appointment.tokenDisplay;
  }
  
  if (appointment.tokenNumber !== undefined && appointment.tokenNumber !== null) {
    return `T-${appointment.tokenNumber.toString().padStart(3, '0')}`;
  }
  
  return '---';
};

/**
 * Sorts appointments by token number ascending.
 */
export const sortByToken = <T extends AppointmentResponse | AppointmentSummaryDTO>(appointments: T[]): T[] => {
  return appointments.toSorted((a, b) => {
    const tokenA = a.tokenNumber ?? 999_999;
    const tokenB = b.tokenNumber ?? 999_999;
    return tokenA - tokenB;
  });
};
