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
    listSummary: vi.fn(),
  },
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
    getStats: vi.fn(),
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

    vi.mocked(patientService.listSummary).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'patient-1',
            fullName: 'Asha',
            patientCode: 'P-1',
            phone: '9999999999',
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
            status: 'SCHEDULED',
            notes: '',
            createdAt: '2026-04-26T00:00:00',
          },
        ],
        page: 0,
        size: 500,
        totalElements: 1,
        totalPages: 1,
      },
    });

    vi.mocked(appointmentService.getStats).mockResolvedValue({
      success: true,
      data: {
        total: 1,
        upcoming: 0,
        byStatus: { 'SCHEDULED': 1 }
      }
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
            departments: ['Cardiology'],
            specializations: ['Cardiology'],
            consultationFee: 500,
          },
        ],
        page: 0,
        size: 50,
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
            departments: ['ICU'],
            certificationLevel: 'RN',
            shiftType: 'DAY',
          },
        ],
        page: 0,
        size: 100,
        totalElements: 1,
        totalPages: 1,
      },
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { hospitalTimezone: 'UTC' }) => state } })}>
        <ReceptionDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Recent Patient Arrivals/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Asha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Dr Khan')[0]).toBeInTheDocument();
      // '01' appears multiple times in different layouts (mobile/desktop)
      const elements = screen.getAllByText('01');
      expect(elements.length).toBeGreaterThanOrEqual(2);
    });
  });
});
