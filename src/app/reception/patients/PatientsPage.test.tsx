import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientsPage from './page';
import { patientService } from '@/services/patientService';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the services
vi.mock('@/services/patientService', () => ({
  patientService: {
    list: vi.fn(),
    create: vi.fn()
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

// Mock PatientRegistrationModal
vi.mock('@/components/reception/PatientRegistrationModal', () => ({
  PatientRegistrationModal: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="registration-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={() => { onSuccess(); onClose(); }}>Success</button>
      </div>
    ) : null
  )
}));

const mockPatients = [
  {
    id: 1,
    fullName: 'John Doe',
    phone: '1234567890',
    gender: 'MALE',
    createdAt: new Date().toISOString(),
    dateOfBirth: '1990-01-01',
    address: '123 Street'
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    phone: '0987654321',
    gender: 'FEMALE',
    createdAt: new Date().toISOString(),
    dateOfBirth: '1992-02-02',
    address: '456 Avenue'
  }
];

describe('PatientsPage', () => {
  const store = configureStore({ reducer: { auth: (state = { user: { role: 'RECEPTIONIST' } }) => state } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches patients', async () => {
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockPatients,
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0
      }
    });

    render(
      <Provider store={store}>
        <PatientsPage />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: 'Patient Directory', level: 1 })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters patients based on search term', async () => {
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: mockPatients,
        totalElements: 2,
        totalPages: 1,
        size: 20,
        number: 0
      }
    });

    render(
      <Provider store={store}>
        <PatientsPage />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by Name/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('opens registration modal when clicking add button', async () => {
    (patientService.list as any).mockResolvedValue({
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0
      }
    });

    render(
      <Provider store={store}>
        <PatientsPage />
      </Provider>
    );

    const addButton = screen.getByTitle('Add New Patient');
    fireEvent.click(addButton);

    expect(screen.getByTestId('registration-modal')).toBeInTheDocument();
  });
});
