import type { ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PharmacyDashboard from './page';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/pharmacy/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="icon-file-text" />,
  Hourglass: () => <div data-testid="icon-hourglass" />,
  CheckCircle2: () => <div data-testid="icon-check-circle" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  IndianRupee: () => <div data-testid="icon-indian-rupee" />,
  Plus: () => <div data-testid="icon-plus" />,
  Search: () => <div data-testid="icon-search" />,
  PlusCircle: () => <div data-testid="icon-plus-circle" />,
  Download: () => <div data-testid="icon-download" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Eye: () => <div data-testid="icon-eye" />,
  Activity: () => <div data-testid="icon-activity" />,
}));

vi.mock('@/modules/pharmacy/api/pharmacyApi', () => ({
  pharmacyApi: {
    getPrescriptions: vi.fn(),
    getMedicineStock: vi.fn(),
    getSaleByPrescription: vi.fn(),
    importStock: vi.fn(),
    getDashboardStats: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('PharmacyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for getDashboardStats
    vi.mocked(pharmacyApi.getDashboardStats).mockResolvedValue({
      success: true,
      data: {
        lowStockCount: 3,
        expiringSoonCount: 1,
        totalBatches: 20,
        totalMedicines: 15
      }
    });
  });

  it('renders pharmacy metrics from services', async () => {
    const today = new Date().toISOString().split('T')[0];
    vi.mocked(pharmacyApi.getPrescriptions).mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 'rx-1',
            patientId: 'patient-1',
            patientName: 'Amit Sharma',
            doctorId: 'doctor-1',
            doctorName: 'Dr Sen',
            items: [
              { id: 'item-1', medicineId: 'med-1', medicineName: 'Paracetamol', dosage: '1 tab', duration: '5 days' },
              { id: 'item-2', medicineId: 'med-2', medicineName: 'Cetirizine', dosage: '1 tab', duration: '3 days' },
            ],
            phone: '9876543210',
            createdAt: `${today}T00:00:00`,
            status: 'PENDING'
          },
          {
            id: 'rx-2',
            patientId: 'patient-2',
            patientName: 'Meera Singh',
            doctorId: 'doctor-2',
            doctorName: 'Dr Rao',
            items: [
              { id: 'item-3', medicineId: 'med-3', medicineName: 'Azithromycin', dosage: '1 tab', duration: '3 days' },
            ],
            phone: '9876543211',
            createdAt: `${today}T00:00:00`,
            status: 'PENDING'
          },
        ],
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    });

    vi.mocked(pharmacyApi.getMedicineStock).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 's1', medicineId: 'm1', medicineName: 'Med 1', quantity: 10, reorderLevel: 50, batchNumber: 'B1', expiryDate: '2026-12-31', price: 100 },
          { id: 's2', medicineId: 'm2', medicineName: 'Med 2', quantity: 5, reorderLevel: 20, batchNumber: 'B2', expiryDate: '2026-12-31', price: 200 },
          { id: 's3', medicineId: 'm3', medicineName: 'Med 3', quantity: 2, reorderLevel: 10, batchNumber: 'B3', expiryDate: '2026-12-31', price: 300 },
        ],
        totalElements: 3,
        page: 0,
        size: 10,
        totalPages: 1,
      },
    });

    vi.mocked(pharmacyApi.getSaleByPrescription).mockResolvedValue({
      success: true,
      data: { 
        saleId: 's1', 
        saleNumber: 'SALE-001', 
        invoiceId: 'i1', 
        invoiceNumber: 'INV-001', 
        totalAmount: 100, 
        status: 'COMPLETED', 
        createdAt: '2026-06-01T10:00:00',
        items: []
      },
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: { fullName: 'Pharmacist' } }) => state } })}>
        <PharmacyDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Prescription Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(pharmacyApi.getPrescriptions).toHaveBeenCalled();
      expect(pharmacyApi.getMedicineStock).toHaveBeenCalled();
      expect(screen.getAllByText('Amit Sharma')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Meera Singh')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Low Stock Alerts')[0]).toBeInTheDocument();
      expect(screen.getByText('03')).toBeInTheDocument();
      // Revenue is based on dispensed prescriptions today.
      // In this test, dispensedRes is not explicitly mocked to have content, 
      // but pharmacyApi.getPrescriptions is called for PENDING, DISPENSED, and CANCELLED.
      // The component logic for revenue calculation uses dispensedList.
    });
  });

  it('filters prescriptions when searching by patient name', async () => {
    vi.mocked(pharmacyApi.getPrescriptions).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 'rx-1', patientName: 'Amit Sharma', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'PENDING', phone: '1234567890' },
          { id: 'rx-2', patientName: 'Meera Singh', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'ACTIVE', phone: '0987654321' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        page: 0
      }
    });
    vi.mocked(pharmacyApi.getMedicineStock).mockResolvedValue({ success: true, data: { content: [], totalElements: 0, page: 0, size: 10, totalPages: 0 } });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: { fullName: 'Pharmacist' } }) => state } })}>
        <PharmacyDashboard />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Amit Sharma').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Meera Singh').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search Patient, Rx.../i);
    fireEvent.change(searchInput, { target: { value: 'Amit' } });

    await waitFor(() => {
      expect(screen.getAllByText('Amit Sharma').length).toBeGreaterThan(0);
      expect(screen.queryByText('Meera Singh')).not.toBeInTheDocument();
    });
  });

  it('filters prescriptions when searching by Rx ID', async () => {
    vi.mocked(pharmacyApi.getPrescriptions).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 'rx-123456', patientName: 'Amit Sharma', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'PENDING', phone: '1234567890' },
          { id: 'rx-789012', patientName: 'Meera Singh', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'ACTIVE', phone: '0987654321' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        page: 0
      }
    });
    vi.mocked(pharmacyApi.getMedicineStock).mockResolvedValue({ success: true, data: { content: [], totalElements: 0, page: 0, size: 10, totalPages: 0 } });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: { fullName: 'Pharmacist' } }) => state } })}>
        <PharmacyDashboard />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Amit Sharma').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search Patient, Rx.../i);
    fireEvent.change(searchInput, { target: { value: '123456' } });

    await waitFor(() => {
      expect(screen.getAllByText('Amit Sharma').length).toBeGreaterThan(0);
      expect(screen.queryByText('Meera Singh')).not.toBeInTheDocument();
    });
  });

  it('filters prescriptions when using column filter', async () => {
    vi.mocked(pharmacyApi.getPrescriptions).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 'rx-1', patientName: 'Amit Sharma', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'PENDING', phone: '1234567890' },
          { id: 'rx-2', patientName: 'Meera Singh', items: [{ id: '1', medicineName: 'M1', dosage: '1', duration: '1' }], status: 'PENDING', phone: '0987654321' },
        ],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        page: 0
      }
    });
    vi.mocked(pharmacyApi.getMedicineStock).mockResolvedValue({ success: true, data: { content: [], totalElements: 0, page: 0, size: 10, totalPages: 0 } });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = { user: { fullName: 'Pharmacist' } }) => state } })}>
        <PharmacyDashboard />
      </Provider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('Amit Sharma').length).toBeGreaterThan(0);
    });

    const patientFilter = screen.getByPlaceholderText(/Patient name.../i);
    fireEvent.change(patientFilter, { target: { value: 'Meera' } });

    await waitFor(() => {
      expect(screen.getAllByText('Meera Singh').length).toBeGreaterThan(0);
      expect(screen.queryByText('Amit Sharma')).not.toBeInTheDocument();
    });
  });
});
