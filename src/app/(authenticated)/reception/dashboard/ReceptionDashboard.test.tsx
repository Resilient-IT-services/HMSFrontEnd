import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ReceptionDashboard from './page';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { nurseService } from '@/services/nurseService';

vi.mock('@/services/patientService', () => ({
  patientService: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/doctorService', () => ({
  doctorService: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/nurseService', () => ({
  nurseService: {
    list: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: { children: ReactNode; title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe('ReceptionDashboard', () => {
  it('renders live metrics from services', async () => {
    const today = new Date().toISOString().split('T')[0];

    vi.mocked(patientService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'patient-1',
            fullName: 'Asha',
            gender: 'FEMALE',
            dob: '1990-01-01',
            phone: '9999999999',
            address: 'Mumbai',
            createdAt: '2026-04-26T00:00:00',
          },
        ],
        page: 0,
        size: 5,
        totalElements: 1,
        totalPages: 1,
      },
    });

    vi.mocked(appointmentService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'appointment-1',
            patientId: 'patient-1',
            patientName: 'Asha',
            doctorId: 'doctor-1',
            doctorName: 'Dr Khan',
            appointmentTime: `${today}T10:00:00`,
            status: 'CHECKED_IN',
            notes: '',
            createdAt: '2026-04-26T00:00:00',
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      },
    });

    vi.mocked(doctorService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            doctorId: 'doctor-1',
            userId: 'user-1',
            assignmentId: 'assign-1',
            fullName: 'Dr Khan',
            phone: '9999999999',
            gender: 'MALE',
            departmentName: 'Cardiology',
            specialization: 'Cardiology',
            consultationFee: 500,
          },
        ],
        page: 0,
        size: 6,
        totalElements: 1,
        totalPages: 1,
      },
    });

    vi.mocked(nurseService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            nurseId: 'nurse-1',
            userId: 'user-2',
            assignmentId: 'assign-2',
            fullName: 'Nurse Reena',
            phone: '8888888888',
            gender: 'FEMALE',
            departmentName: 'ICU',
            certificationLevel: 'RN',
            shiftType: 'DAY',
          },
        ],
        page: 0,
        size: 5,
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = {}) => state } })}>
        <ReceptionDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Recent Patient Arrivals/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Asha')).toBeInTheDocument();
      expect(screen.getByText('Dr Khan')).toBeInTheDocument();
      expect(screen.getByText('1 queued today')).toBeInTheDocument();
      expect(screen.getByText('Nurse Reena')).toBeInTheDocument();
    });
  });
});
