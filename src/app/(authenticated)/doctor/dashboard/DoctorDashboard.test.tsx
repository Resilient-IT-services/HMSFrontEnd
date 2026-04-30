import type { ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DoctorDashboard from './page';
import { appointmentService } from '@/services/appointmentService';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('DoctorDashboard', () => {
  it('renders doctor appointments from the service layer', async () => {
    vi.mocked(appointmentService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'app-1',
            patientId: 'patient-1',
            patientName: 'Jane Roe',
            doctorId: 'doctor-1',
            doctorName: 'John Doe',
            appointmentTime: `${new Date().toISOString().split('T')[0]}T09:00:00`,
            status: 'SCHEDULED',
            notes: 'Follow-up',
            createdAt: '2026-04-26T00:00:00',
          },
          {
            id: 'app-2',
            patientId: 'patient-2',
            patientName: 'Other Patient',
            doctorId: 'doctor-2',
            doctorName: 'Other Doctor',
            appointmentTime: `${new Date().toISOString().split('T')[0]}T11:00:00`,
            status: 'DELAYED',
            notes: '',
            createdAt: '2026-04-26T00:00:00',
          },
        ],
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const mockUser = { 
      id: 'doctor-1', 
      fullName: 'John Doe',
      currentHospitalId: 'hosp-1',
      memberships: [
        {
          hospitalId: 'hosp-1',
          roleAssignments: [
            {
              roleCode: 'DOCTOR',
              active: true,
              doctorDetails: { consultationFee: 500 }
            }
          ]
        }
      ]
    };

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: mockUser }) => state } })}>
        <DoctorDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Upcoming Patient Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(appointmentService.list).toHaveBeenCalledWith(0, 100, undefined, today, 'doctor-1');
      expect(screen.getByText('Jane Roe')).toBeInTheDocument();
      expect(screen.getByText(/Today's Earnings/i)).toBeInTheDocument();
      expect(screen.getByText(/₹1000/i)).toBeInTheDocument();
    });
  });

  it('starts next consultation when clicking the button', async () => {
    const today = new Date().toISOString().split('T')[0];
    vi.mocked(appointmentService.list).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'app-1',
            patientId: 'patient-1',
            patientName: 'Jane Roe',
            doctorId: 'doctor-1',
            doctorName: 'John Doe',
            appointmentTime: `${today}T09:00:00`,
            status: 'SCHEDULED',
            notes: 'Follow-up',
            createdAt: '2026-04-26T00:00:00',
          }
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      },
    });

    vi.mocked(appointmentService.updateStatus).mockResolvedValue({ success: true, data: {} as any });

    const mockUser = { 
      id: 'doctor-1', 
      fullName: 'John Doe',
      currentHospitalId: 'hosp-1',
      memberships: [
        {
          hospitalId: 'hosp-1',
          roleAssignments: [
            {
              roleCode: 'DOCTOR',
              active: true,
              doctorDetails: { consultationFee: 500 }
            }
          ]
        }
      ]
    };

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: mockUser }) => state } })}>
        <DoctorDashboard />
      </Provider>,
    );

    await waitFor(() => screen.getByText('Jane Roe'));

    const startBtn = screen.getByText(/Start Next Consultation/i);
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(appointmentService.updateStatus).toHaveBeenCalledWith('app-1', { status: 'DELAYED' });
      expect(mockPush).toHaveBeenCalledWith('/doctor/active-consultation?appointmentId=app-1');
    });
  });
});
