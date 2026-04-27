import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientQueuePage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { appointmentService } from '@/services/appointmentService';

vi.mock('@/services/appointmentService');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/doctor/patient-queue',
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
        status: 'SCHEDULED',
      },
      {
        id: '2',
        patientId: 'p2',
        patientName: 'Bob Jones',
        doctorId: 'doc-1',
        doctorName: 'Dr. John Doe',
        appointmentTime: new Date().toISOString().split('T')[0] + 'T11:00:00',
        status: 'DELAYED',
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
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('02')).toBeInTheDocument(); // Total
    expect(screen.getByText('01')).toBeAllInTheDocument ? expect(screen.getAllByText('01').length).toBeGreaterThan(0) : null;
  });
});
