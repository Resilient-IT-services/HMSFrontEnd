import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
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
    list: vi.fn(),
    getAvailability: vi.fn(),
  },
}));

vi.mock('@/services/patientService', () => ({
  patientService: {
    get: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    create: vi.fn(),
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
  { doctorId: 'doctor-1', fullName: 'Dr. Smith', specialization: 'Cardiology', userId: 'user-1', consultationFee: 500 },
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
};

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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the fast-track booking flow', async () => {
    render(<CreateAppointmentPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Fast-Track Appointment/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByLabelText(/Patient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Doctor/i)).toBeInTheDocument();
  });

  it.skip('submits an appointment after selecting patient, doctor, and slot', async () => {
    render(<CreateAppointmentPage />);

    // Select Patient
    const patientInput = screen.getByLabelText(/Patient/i);
    fireEvent.change(patientInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(doctorService.getAvailability).toHaveBeenCalledWith('doctor-1', expect.any(String));
    });

    // Select slot
    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('10:00'));
    
    // Confirm booking
    const confirmButtons = screen.getAllByRole('button', { name: /Book Appointment/i });
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(appointmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          appointmentTime: expect.stringContaining('T10:00:00'),
        })
      );
    });
  });

  it('prefills patient and doctor from query params', async () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'patientId') return 'patient-1';
        if (key === 'doctorId') return 'doctor-1';
        return null;
      }),
    });

    render(<CreateAppointmentPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Dr. Smith/i)).toBeInTheDocument();
    });
  });
});
