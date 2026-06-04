import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import DoctorDashboard from './page';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
    updateStatus: vi.fn(),
    startNextConsultation: vi.fn(),
  },
}));

vi.mock('@/services/doctorService', () => ({
  doctorService: {
    getRevenueSummary: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title, hideTitle }: any) => (
    <div data-testid="main-layout">
      {!hideTitle && <h1>{title}</h1>}
      {children}
    </div>
  )
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
            status: 'VITALS_RECORDED',
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
            status: 'VITALS_RECORDED',
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

    vi.mocked(doctorService.getRevenueSummary).mockResolvedValue({
      success: true,
      data: { totalAppointments: 2, totalRevenue: 1000, averageFee: 500 }
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: mockUser, hospitalTimezone: 'UTC' }) => state } })}>
        <DoctorDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Live Active Patient Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(appointmentService.list).toHaveBeenCalledWith({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        from: expect.anything(),
        to: expect.anything(),
        doctorId: 'doctor-1'
      });
      expect(screen.getAllByText('Jane Roe')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/₹1,000/)[0]).toBeInTheDocument();
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
            status: 'VITALS_RECORDED',
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

    vi.mocked(appointmentService.startNextConsultation).mockResolvedValue({
      success: true,
      data: { id: 'app-1' } as any
    });

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

    vi.mocked(doctorService.getRevenueSummary).mockResolvedValue({
      success: true,
      data: { totalAppointments: 2, totalRevenue: 1000, averageFee: 500 }
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: mockUser, hospitalTimezone: 'UTC' }) => state } })}>
        <DoctorDashboard />
      </Provider>,
    );

    await waitFor(() => screen.getAllByText('Jane Roe')[0]);

    const startBtn = screen.getByText(/Start Next Consultation/i);
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(appointmentService.startNextConsultation).toHaveBeenCalledWith('doctor-1');
      expect(appointmentService.updateStatus).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/doctor/active-consultation?appointmentId=app-1');
    });
  });
});
