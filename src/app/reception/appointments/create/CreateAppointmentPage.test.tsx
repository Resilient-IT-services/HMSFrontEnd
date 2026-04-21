import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateAppointmentPage from './page';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the services
vi.mock('@/services/appointmentService', () => ({
  appointmentService: {
    create: vi.fn()
  }
}));

vi.mock('@/services/patientService', () => ({
  patientService: {
    list: vi.fn()
  }
}));

vi.mock('@/services/doctorService', () => ({
  doctorService: {
    list: vi.fn()
  }
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

// Mock useSearchParams
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn()
  }),
  useRouter: () => ({
    push: vi.fn()
  })
}));

const mockPatients = [
  { id: 1, fullName: 'John Doe', phone: '1234567890' }
];

const mockDoctors = [
  { id: 101, fullName: 'Dr. Smith', specialization: 'General', department: 'Medicine' }
];

describe('CreateAppointmentPage', () => {
  const store = configureStore({ reducer: { auth: (state = { user: { role: 'RECEPTIONIST' } }) => state } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches initial data', async () => {
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockPatients }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });

    render(
      <Provider store={store}>
        <CreateAppointmentPage />
      </Provider>
    );

    expect(screen.getByText(/Book New Appointment/i)).toBeInTheDocument();
    
    // Type in search box to show patient list
    const searchInput = screen.getByPlaceholderText(/Name or Patient ID/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
  });

  it('submits the form successfully', async () => {
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockPatients }
    });
    (doctorService.list as any).mockResolvedValue({
      success: true,
      data: { content: mockDoctors }
    });
    (appointmentService.create as any).mockResolvedValue({ success: true });

    render(
      <Provider store={store}>
        <CreateAppointmentPage />
      </Provider>
    );

    // Type in search box to show patient list
    const searchInput = screen.getByPlaceholderText(/Name or Patient ID/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      const patientButton = screen.getByText(/John Doe/i);
      fireEvent.click(patientButton);
    });

    // Select doctor
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '101' } });
    
    // Select a time slot
    const timeSlot = screen.getByText('09:00');
    fireEvent.click(timeSlot);

    // Click submit
    const submitButton = screen.getByRole('button', { name: /Book Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(appointmentService.create).toHaveBeenCalled();
    });
  });
});
