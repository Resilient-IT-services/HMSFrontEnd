import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PharmacyDashboard from './page';
import { pharmacyService } from '@/services/pharmacyService';

vi.mock('@/services/pharmacyService', () => ({
  pharmacyService: {
    listPrescriptions: vi.fn(),
    getLowStockCount: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('PharmacyDashboard', () => {
  it('renders pharmacy metrics from services', async () => {
    vi.mocked(pharmacyService.listPrescriptions).mockResolvedValue({
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
            status: 'PENDING',
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
            status: 'COMPLETED',
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

    vi.mocked(pharmacyService.getLowStockCount).mockResolvedValue({
      success: true,
      data: {
        totalElements: 3,
      },
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = {}) => state } })}>
        <PharmacyDashboard />
      </Provider>,
    );

    expect(screen.getByText(/Prescription Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(pharmacyService.listPrescriptions).toHaveBeenCalled();
      expect(pharmacyService.getLowStockCount).toHaveBeenCalled();
      expect(screen.getAllByText('Amit Sharma')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Meera Singh')[0]).toBeInTheDocument();
      expect(screen.getByText('3 inventory records currently need attention.')).toBeInTheDocument();
    });
  });
});
