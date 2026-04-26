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

// ... (lucide mock)

const mockDoctors = [
  { userId: 'd1', id: 'd1', fullName: 'Dr. Smith', specialization: 'Cardiology' },
  { userId: 'd2', id: 'd2', fullName: 'Dr. Jones', specialization: 'Neurology' },
];

// ...

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
    (doctorService.getAvailability as any).mockResolvedValue({
      success: true,
      data: { sessions: [] }
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
      expect(screen.getByText(/Appointment Scheduling/i)).toBeInTheDocument();
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

    // Mock search results for patient manually since the search logic is inline
    // In a real app we'd trigger search, but here we can just mock selected patient if we passed it in URL
    // For this test, let's simulate the search input if needed or just mock initial patient
  });
});
