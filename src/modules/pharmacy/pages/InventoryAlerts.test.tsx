import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InventoryAlerts } from './InventoryAlerts';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

vi.mock('@/modules/pharmacy/api/pharmacyApi', () => ({
  pharmacyApi: {
    getLowStockAlerts: vi.fn(),
    getExpiryAlerts: vi.fn(),
  },
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title, hideTitle }: any) => (
    <div>
      {!hideTitle && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

describe('InventoryAlerts', () => {
  it('renders alerts', async () => {
    vi.mocked(pharmacyApi.getLowStockAlerts).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: '1', medicineName: 'Med A', batchNumber: 'B1', quantity: 5, expiryDate: '2026-12-31' },
        ],
      },
    } as any);

    vi.mocked(pharmacyApi.getExpiryAlerts).mockResolvedValue({
      success: true,
      data: [
        { id: '2', medicineName: 'Med B', batchNumber: 'B2', quantity: 100, expiryDate: '2026-05-31' },
      ],
    } as any);

    render(<InventoryAlerts />);

    expect(screen.getByText('Inventory Alerts')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Med A')).toBeInTheDocument();
      expect(screen.getByText('Med B')).toBeInTheDocument();
      expect(screen.getByText('5 Units')).toBeInTheDocument();
    });
  });

  it('handles empty results', async () => {
    vi.mocked(pharmacyApi.getLowStockAlerts).mockResolvedValue({ success: true, data: { content: [] } } as any);
    vi.mocked(pharmacyApi.getExpiryAlerts).mockResolvedValue({ success: true, data: [] } as any);

    render(<InventoryAlerts />);

    await waitFor(() => {
      expect(screen.getByText('No low stock items detected.')).toBeInTheDocument();
      expect(screen.getByText('No items expiring soon.')).toBeInTheDocument();
    });
  });
});
