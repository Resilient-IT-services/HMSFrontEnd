import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodayAppointmentsPage from './page';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LayoutProvider } from '@/context/LayoutContext';

// Mock the services
vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    list: vi.fn(),
    updateStatus: vi.fn()
  }
}));

vi.mock('@/services/doctorService', () => ({
  doctorService: {
    list: vi.fn()
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/reception/appointments',
}));

// Mock MainLayout
vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

const mockAppointments = [
  {
    id: 1,
    patientId: 'p1',
    patientName: 'John Doe',
    doctorId: 101,
    doctorName: 'Dr. Smith',
    appointmentTime: new Date().toISOString(),
    status: 'SCHEDULED',
    reason: 'Checkup'
  },
  {
    id: 2,
    patientId: 'p2',
    patientName: 'Jane Smith',
    doctorId: 102,
    doctorName: 'Dr. Jones',
    appointmentTime: new Date().toISOString(),
    status: 'CHECKED_IN',
    reason: 'Followup'
  },
  {
    id: 3,
    patientId: 'p3',
    patientName: 'Future Patient',
    doctorId: 101,
    doctorName: 'Dr. Smith',
    appointmentTime: new Date(Date.now() + 86_400_000).toISOString(), // Tomorrow
    status: 'SCHEDULED',
    reason: 'Checkup'
  }
];

const mockDoctors = [
  { id: 101, fullName: 'Dr. Smith', specialization: 'General' },
  { id: 102, fullName: 'Dr. Jones', specialization: 'Cardio' }
];

describe('TodayAppointmentsPage', () => {
  const store = configureStore({ reducer: { auth: (state = { user: { role: 'RECEPTIONIST' } }) => state } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches today\'s appointments only', async () => {
    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 3,
        totalPages: 1,
        size: 100,
        number: 0
      }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockDoctors,
        totalElements: 2
      }
    });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <TodayAppointmentsPage />
        </LayoutProvider>
      </Provider>
    );

    expect(screen.getByRole('heading', { name: "Daily Schedule", level: 1 })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('Future Patient')).not.toBeInTheDocument();
    });
  });

  it('shows future appointments only in UPCOMING tab', async () => {
    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 3
      }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <TodayAppointmentsPage />
        </LayoutProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const upcomingButton = screen.getByRole('button', { name: 'UPCOMING' });
    fireEvent.click(upcomingButton);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Future Patient')).toBeInTheDocument();
  });

  it('filters appointments by search term', async () => {
    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 3
      }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <TodayAppointmentsPage />
        </LayoutProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search patient...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters appointments by status', async () => {
    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 2
      }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <TodayAppointmentsPage />
        </LayoutProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const checkedInButton = screen.getByRole('button', { name: 'CHECKED IN' });
    fireEvent.click(checkedInButton);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
