import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientQueuePage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { appointmentService } from '@/services/appointmentService';
import type { ReactNode } from 'react';

vi.mock('@/services/appointmentService');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/doctor/patient-queue',
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const createMockStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: { id: 'doc-1', fullName: 'Dr. John Doe', roles: ['DOCTOR'] },
        isAuthenticated: true,
        isLoading: false,
        activeRole: 'DOCTOR',
        isSuperMode: false,
        hospitalTimezone: 'UTC',
        error: null,
        ...initialState
      },
    },
  });
};

describe('PatientQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches appointments', async () => {
    const mockAppointments = [
      {
        id: '1',
        patientId: 'p1',
        patientName: 'Alice Smith',
        doctorId: 'doc-1',
        doctorName: 'Dr. John Doe',
        appointmentTime: new Date().toISOString().split('T')[0] + 'T10:00:00',
        status: 'PAID',
      },
      {
        id: '2',
        patientId: 'p2',
        patientName: 'Bob Jones',
        doctorId: 'doc-1',
        doctorName: 'Dr. John Doe',
        appointmentTime: new Date().toISOString().split('T')[0] + 'T11:00:00',
        status: 'VITALS_RECORDED',
      }
    ];

    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 2,
      }
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <PatientQueuePage />
      </Provider>
    );

    expect(screen.getByText('Patient Queue')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getAllByText('Alice Smith')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Bob Jones')[0]).toBeInTheDocument();
    });

    // Check stats
    const elements = screen.getAllByText('02');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('hides completed appointments from the queue while keeping completed stats', async () => {
    const mockAppointments = [
      {
        id: '1',
        patientId: 'p1',
        patientName: 'Alice Smith',
        doctorId: 'doc-1',
        doctorName: 'Dr. John Doe',
        appointmentTime: new Date().toISOString().split('T')[0] + 'T10:00:00',
        status: 'PAID',
      },
      {
        id: '2',
        patientId: 'p2',
        patientName: 'Bob Jones',
        doctorId: 'doc-1',
        doctorName: 'Dr. John Doe',
        appointmentTime: new Date().toISOString().split('T')[0] + 'T11:00:00',
        status: 'COMPLETED',
      }
    ];

    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 2,
      }
    });

    const store = createMockStore();
    render(
      <Provider store={store}>
        <PatientQueuePage />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Alice Smith')[0]).toBeInTheDocument();
    });

    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    expect(screen.queryByText('Reopen')).not.toBeInTheDocument();

    // Stats should still show completed count
    expect(screen.getAllByText('Completed')[0]).toBeInTheDocument();
    const stats01 = screen.getAllByText('01', { selector: '.font-headline-md' });
    expect(stats01.length).toBeGreaterThanOrEqual(2); // One for Waiting, one for Completed
  });
});
