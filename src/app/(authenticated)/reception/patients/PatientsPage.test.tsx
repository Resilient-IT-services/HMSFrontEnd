import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientsPage from './page';
import { patientService } from '@/services/patientService';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock the services
vi.mock('@/services/patientService', () => ({
  patientService: {
    list: vi.fn(),
    listSummary: vi.fn(),
    create: vi.fn(),
    getDashboardStats: vi.fn()
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

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

const mockPatients = [
  {
    id: '1',
    fullName: 'John Doe',
    phone: '1234567890',
    gender: 'MALE',
    createdAt: new Date().toISOString(),
    dateOfBirth: '1990-01-01',
    address: '123 Street'
  },
  {
    id: '2',
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
    (patientService.listSummary as any).mockResolvedValue({
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
      expect(screen.getAllByText('John Doe')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument();
    });
  });

  it('triggers server-side search when search term changes', async () => {
    vi.useFakeTimers();
    (patientService.listSummary as any).mockResolvedValue({
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

    const searchInput = screen.getByPlaceholderText(/Search by name, ID, or phone/i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // Should not call listSummary immediately due to debounce
    expect(patientService.listSummary).not.toHaveBeenCalledWith(0, 10, 'Jane');

    // Fast-forward debounce time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Flush microtasks to allow effects and async calls to run
    await act(async () => {
      await Promise.resolve();
    });

    expect(patientService.listSummary).toHaveBeenCalledWith(0, 404, 'Jane');
    vi.useRealTimers();
  });
});
