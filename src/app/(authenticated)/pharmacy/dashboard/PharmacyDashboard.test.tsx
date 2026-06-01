import type { ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PharmacyDashboard from './page';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

vi.mock('@/modules/pharmacy/api/pharmacyApi', () => ({
  pharmacyApi: {
    getPrescriptions: vi.fn(),
    getMedicineStock: vi.fn(),
    getSaleByPrescription: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('PharmacyDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pharmacy metrics from services', async () => {
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
            createdAt: '2026-04-26T00:00:00',
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
            createdAt: '2026-04-26T00:00:00',
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
    });
  });

  it('filters prescriptions when searching by patient name', async () => {
    vi.mocked(pharmacyApi.getPrescriptions).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 'rx-1', patientName: 'Amit Sharma', items: [], status: 'PENDING', phone: '1234567890' },
          { id: 'rx-2', patientName: 'Meera Singh', items: [], status: 'ACTIVE', phone: '0987654321' },
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
          { id: 'rx-123456', patientName: 'Amit Sharma', items: [], status: 'PENDING', phone: '1234567890' },
          { id: 'rx-789012', patientName: 'Meera Singh', items: [], status: 'ACTIVE', phone: '0987654321' },
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
});
