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
    listSummary: vi.fn(),
    getStats: vi.fn(),
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
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/reception/appointments',
}));

// Mock MainLayout
vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title, hideTitle }: any) => (
    <div data-testid="main-layout">
      {!hideTitle && <h1>{title}</h1>}
      {children}
    </div>
  )
}));

const mockDoctors = [
  { id: '101', fullName: 'Dr. Smith', specializations: ['General'] },
  { id: '102', fullName: 'Dr. Jones', specializations: ['Cardio'] }
];

describe('TodayAppointmentsPage', () => {
  const store = configureStore({ reducer: { auth: (state = { user: { role: 'RECEPTIONIST' }, hospitalTimezone: 'UTC' }) => state } });

  beforeEach(() => {
    vi.clearAllMocks();
    (appointmentService.getStats as any).mockResolvedValue({
      success: true,
      data: { total: 0, upcoming: 0, byStatus: {} }
    });
  });

  it('renders correctly and filters appointments by source of truth', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const mockAppointments = [
      {
        id: '1',
        patientId: 'p1',
        patientName: 'Today Scheduled',
        doctorId: '101',
        doctorName: 'Dr. Smith',
        appointmentTime: `${todayStr}T10:00:00.000Z`,
        status: 'SCHEDULED',
        reason: 'Checkup'
      },
      {
        id: '2',
        patientId: 'p2',
        patientName: 'Today Completed',
        doctorId: '102',
        doctorName: 'Dr. Jones',
        appointmentTime: `${todayStr}T11:00:00.000Z`,
        status: 'COMPLETED',
        reason: 'Followup'
      },
      {
        id: '3',
        patientId: 'p3',
        patientName: 'Tomorrow Scheduled',
        doctorId: '101',
        doctorName: 'Dr. Smith',
        appointmentTime: `${tomorrowStr}T10:00:00.000Z`,
        status: 'SCHEDULED',
        reason: 'Checkup'
      }
    ];

    (appointmentService.listSummary as any).mockResolvedValue({
      success: true,
      data: {
        content: mockAppointments,
        totalElements: 3,
        totalPages: 1,
        size: 500,
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

    expect(screen.getByRole('heading', { name: "Today's Appointments", level: 1 })).toBeInTheDocument();
    
    // Default tab is TOTAL TODAY, should show today's appointments (Scheduled and Completed)
    await waitFor(() => {
      expect(screen.getAllByText('Today Scheduled')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Today Completed')[0]).toBeInTheDocument();
      expect(screen.queryByText('Tomorrow Scheduled')).not.toBeInTheDocument();
    }, { timeout: 10_000 });

    // Check counts (2 total today, 1 completed, 1 upcoming)
    const card2 = screen.getByText('2'); // Total Today
    expect(card2).toBeInTheDocument();

    const ones = screen.getAllByText('1'); // Completed and Upcoming both have 1
    expect(ones.length).toBeGreaterThanOrEqual(2);

    // Switch to COMPLETED
    const completedTab = screen.getByText('Completed');
    fireEvent.click(completedTab);

    await waitFor(() => {
      expect(screen.queryByText('Today Scheduled')).not.toBeInTheDocument();
      expect(screen.getAllByText('Today Completed')[0]).toBeInTheDocument();
    });

    // Switch to UPCOMING
    const upcomingTab = screen.getByText('Upcoming');
    fireEvent.click(upcomingTab);

    await waitFor(() => {
      expect(screen.queryByText('Today Scheduled')).not.toBeInTheDocument();
      expect(screen.queryByText('Today Completed')).not.toBeInTheDocument();
      expect(screen.getAllByText('Tomorrow Scheduled')[0]).toBeInTheDocument();
    });
  }, 10_000);
});
