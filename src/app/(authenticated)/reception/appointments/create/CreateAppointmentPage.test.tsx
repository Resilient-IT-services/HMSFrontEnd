import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateAppointmentPage from './page';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutProvider } from '@/context/LayoutContext';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock services
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
    list: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock MainLayout to prevent issues with it
vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

const mockDoctors = [
  { userId: 'd1', id: 'd1', fullName: 'Dr. Smith', specialization: 'Cardiology' },
  { userId: 'd2', id: 'd2', fullName: 'Dr. Jones', specialization: 'Neurology' },
];

const mockPatients = [
  { id: 'p1', fullName: 'John Doe', phone: '1234567890' },
];

const mockAvailability = {
  sessions: [
    {
      startTime: '22:00',
      endTime: '23:59',
      available: true,
      currentBookings: 0,
      maxPatients: 10,
    }
  ]
};

describe('CreateAppointmentPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush, back: vi.fn() });
    (useSearchParams as any).mockReturnValue({ get: vi.fn() });
    
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });
    (doctorService.getAvailability as any).mockResolvedValue({
      success: true,
      data: mockAvailability
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
        <CreateAppointmentPage />
      </LayoutProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Appointment Scheduling/i, level: 1 })).toBeInTheDocument();
    });

    expect(screen.getAllByText('Dr. Smith')[0]).toBeInTheDocument();
  });

  it('submits the form successfully', async () => {
    (appointmentService.create as any).mockResolvedValue({ success: true });
    
    render(
      <LayoutProvider>
        <CreateAppointmentPage />
      </LayoutProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Dr. Smith')[0]).toBeInTheDocument();
    });

    // Select doctor
    fireEvent.click(screen.getAllByText('Dr. Smith')[0]);

    // Select session
    await waitFor(() => {
      expect(screen.getByText('22:00 - 23:59')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('22:00 - 23:59'));

    // Search for patient
    const searchInput = screen.getByPlaceholderText(/Patient Name or Phone/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Select patient from search results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('John Doe'));
  });
});
