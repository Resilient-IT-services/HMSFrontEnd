import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateAppointmentPage from './page';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@/services/doctorService', () => ({
  doctorService: {
    get: vi.fn(),
    list: vi.fn(),
    getAvailability: vi.fn(),
  },
}));

vi.mock('@/services/patientService', () => ({
  patientService: {
    get: vi.fn(),
    list: vi.fn(),
    listSummary: vi.fn(),
  },
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    create: vi.fn(),
    list: vi.fn(),
  },
}));

// Mock MainLayout
vi.mock('@/components/ui/MainLayout', () => ({
  __esModule: true,
  default: ({ children, title }: any) => <div data-testid="main-layout"><h1>{title}</h1>{children}</div>,
}));

// Mock triggerGlobalToast
vi.mock('@/components/ui/Toast', () => ({
  triggerGlobalToast: vi.fn(),
}));

const mockPush = vi.fn();
const mockBack = vi.fn();

const mockDoctors = [
  {
    doctorId: 'doctor-1',
    userId: 'user-1',
    assignmentId: 'assignment-1',
    fullName: 'Dr. Smith',
    phone: '9999999999',
    gender: 'MALE',
    departments: ['Cardiology'],
    specializations: ['Cardiology'],
    consultationFee: 500,
  },
];

const mockAvailability = {
  sessions: [
    { startTime: '10:00', endTime: '12:00', available: true, maxPatients: 10, currentBookings: 0 },
    { startTime: '14:00', endTime: '16:00', available: true, maxPatients: 10, currentBookings: 0 },
  ],
};

const mockPatient = {
  id: 'patient-1',
  fullName: 'John Doe',
  phone: '1234567890',
  gender: 'MALE',
  dob: '1990-01-01',
  patientCode: 'P-001'
};

const mockStore = configureStore({
  reducer: {
    auth: (state = { hospitalTimezone: 'UTC' }) => state
  }
});

describe('CreateAppointmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-04-27T09:00:00'));

    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });

    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn(() => null),
    });

    (doctorService.list as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { content: mockDoctors },
    });

    (doctorService.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: mockDoctors[0],
    });

    (doctorService.getAvailability as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockAvailability,
    });

    (patientService.list as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { content: [mockPatient] },
    });

    (patientService.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: mockPatient,
    });

    (appointmentService.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    (appointmentService.list as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
        data: { content: [] }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the fast-track booking flow', async () => {
    render(
      <Provider store={mockStore}>
        <CreateAppointmentPage />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Fast-Track Appointment/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/Patient/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Doctor/i).length).toBeGreaterThan(0);
  });

  it('prefills patient and doctor from query params', async () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'patientId') return 'patient-1';
        if (key === 'doctorId') return 'doctor-1';
        return null;
      }),
    });

    render(
      <Provider store={mockStore}>
        <CreateAppointmentPage />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Dr. Smith/i)[0]).toBeInTheDocument();
    });
  });
});
