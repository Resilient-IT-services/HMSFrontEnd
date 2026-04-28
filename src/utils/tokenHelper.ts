import { AppointmentResponse } from '@/types/api';

/**
 * Formats a token for display.
 * Priority: 
 * 1. backend tokenDisplay (e.g., "T-001")
 * 2. calculated display from tokenNumber (e.g., "T-001")
 * 3. Fallback placeholder
 */
export const formatToken = (appointment: AppointmentResponse | undefined | null): string => {
  if (!appointment) return '---';
  
  if (appointment.tokenDisplay) {
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
export const sortByToken = (appointments: AppointmentResponse[]): AppointmentResponse[] => {
  return [...appointments].sort((a, b) => {
    const tokenA = a.tokenNumber ?? 999999;
    const tokenB = b.tokenNumber ?? 999999;
    return tokenA - tokenB;
  });
};
