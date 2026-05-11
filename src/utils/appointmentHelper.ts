import { AppointmentResponse } from '@/types/api';
import { appointmentService } from '@/services/appointmentService';

/**
 * Normalizes an appointment status based on its scheduled time.
 * If the appointment is older than 24 hours and not completed, it's treated as CANCELLED.
 */
export const getExpiredAppointments = (appointments: AppointmentResponse[]): AppointmentResponse[] => {
  if (!appointments) return [];
  
  const now = Date.now();
  const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  return appointments.filter(app => {
    // Skip if already terminal status
    if (app.status === 'COMPLETED' || app.status === 'CANCELLED') {
      return false;
    }

    const appointmentTime = new Date(app.appointmentTime).getTime();
    return now > (appointmentTime + EXPIRATION_MS);
  });
};

/**
 * Triggers status updates for expired appointments in the background.
 */
export const syncExpiredAppointments = async (appointments: AppointmentResponse[]) => {
  const expired = getExpiredAppointments(appointments);
  
  if (expired.length === 0) return;

  console.log(`Syncing ${expired.length} expired appointments...`);
  
  // We process them in sequence or small batches to avoid overwhelming the server
  for (const app of expired) {
    try {
      await appointmentService.updateStatus(app.id, { status: 'CANCELLED' });
    } catch (error) {
      console.error(`Failed to auto-cancel appointment ${app.id}:`, error);
    }
  }
};

/**
 * Local normalization for immediate UI feedback before sync completes
 */
export const normalizeAppointmentData = (appointments: AppointmentResponse[]): AppointmentResponse[] => {
  if (!appointments) return [];
  
  const now = Date.now();
  const EXPIRATION_MS = 24 * 60 * 60 * 1000;

  return appointments.map(app => {
    if (app.status === 'COMPLETED' || app.status === 'CANCELLED') {
      return app;
    }

    const appointmentTime = new Date(app.appointmentTime).getTime();
    if (now > (appointmentTime + EXPIRATION_MS)) {
      return { ...app, status: 'CANCELLED' as any };
    }
    
    return app;
  });
};
