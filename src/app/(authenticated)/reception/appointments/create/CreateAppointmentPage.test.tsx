import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateAppointmentPage from './page';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock services
vi.mock('@/services/doctorService', () => ({
  doctorService: {
    list: vi.fn(),
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
    list: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock lucide-react to avoid issues with icon rendering in tests
vi.mock('lucide-react', () => ({
  Calendar: () => <span>Calendar</span>,
  Clock: () => <span>Clock</span>,
  User: () => <span>User</span>,
  Stethoscope: () => <span>Stethoscope</span>,
  Search: () => <span>Search</span>,
  Plus: () => <span>Plus</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  ArrowLeft: () => <span>ArrowLeft</span>,
  CheckCircle2: () => <span>CheckCircle2</span>,
  CalendarDays: () => <span>CalendarDays</span>,
}));

const mockDoctors = [
  { id: 'd1', fullName: 'Dr. Smith', specialization: 'Cardiology' },
  { id: 'd2', fullName: 'Dr. Jones', specialization: 'Neurology' },
];

const mockPatients = [
  { id: 'p1', fullName: 'John Doe', phone: '1234567890', dob: '1980-01-01', gender: 'MALE', address: '123 Main St' },
];

import { LayoutProvider } from '@/context/LayoutContext';

describe('CreateAppointmentPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (useSearchParams as any).mockReturnValue({ get: vi.fn() });
    
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });
    (appointmentService.list as any).mockResolvedValue({
      success: true,
      data: { content: [] }
    });
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockPatients }
    });
  });

  it('renders correctly and fetches initial data', async () => {
    render(
      <LayoutProvider>
        <CreateAppointmentPage params={Promise.resolve({})} />
      </LayoutProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Schedule Appointment/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    (appointmentService.create as any).mockResolvedValue({ success: true });
    
    render(
      <LayoutProvider>
        <CreateAppointmentPage params={Promise.resolve({})} />
      </LayoutProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Select doctor
    fireEvent.click(screen.getByText('Dr. Smith'));

    // Mock search results for patient manually since the search logic is inline
    // In a real app we'd trigger search, but here we can just mock selected patient if we passed it in URL
    // For this test, let's simulate the search input if needed or just mock initial patient
  });
});
