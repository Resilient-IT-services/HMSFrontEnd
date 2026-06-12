import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickStockAddModal from './QuickStockAddModal';
import { pharmacyApi } from '../api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

// Mock components and modules
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, title, onClose }: any) => (
    <div data-testid="modal">
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));

vi.mock('../api/pharmacyApi', () => ({
  pharmacyApi: {
    addStock: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  triggerGlobalToast: vi.fn(),
}));

describe('QuickStockAddModal', () => {
  const defaultProps = {
    medicineId: 'med-123',
    medicineName: 'Paracetamol',
    currentStock: 10,
    taxPercentage: 12,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with medicine info', () => {
    render(<QuickStockAddModal {...defaultProps} />);
    expect(screen.getByText('Paracetamol')).toBeDefined();
    expect(screen.getByText('10 Units')).toBeDefined();
  });

  it('validates prices before submission', async () => {
    render(<QuickStockAddModal {...defaultProps} />);
    
    const purchaseInput = screen.getByLabelText(/Unit Cost/i);
    const sellingInput = screen.getByLabelText(/Retail Price/i);
    const form = screen.getByTestId('stock-form');

    // Case 1: Selling price less than purchase price
    fireEvent.change(purchaseInput, { target: { value: '100' } });
    fireEvent.change(sellingInput, { target: { value: '80' } });
    fireEvent.submit(form);

    expect(triggerGlobalToast).toHaveBeenCalledWith('Selling price cannot be less than purchase price', 'error');
  });

  it('calls addStock API with correct data on valid submission', async () => {
    vi.mocked(pharmacyApi.addStock).mockResolvedValue({ success: true, data: {} } as any);
    
    render(<QuickStockAddModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/Batch Number/i), { target: { value: 'B-123' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Unit Cost/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Retail Price/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), { target: { value: '2025-12-31' } });

    fireEvent.submit(screen.getByTestId('stock-form'));

    await waitFor(() => {
      expect(pharmacyApi.addStock).toHaveBeenCalledWith(expect.objectContaining({
        medicineId: 'med-123',
        batchNumber: 'B-123',
        quantity: 50,
        purchasePrice: 10,
        sellingPrice: 15,
      }));
    });

    expect(triggerGlobalToast).toHaveBeenCalledWith('Stock added successfully', 'success');
    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('handles API error correctly', async () => {
    vi.mocked(pharmacyApi.addStock).mockRejectedValue(new Error('API Error'));
    
    render(<QuickStockAddModal {...defaultProps} />);
    
    fireEvent.change(screen.getByLabelText(/Batch Number/i), { target: { value: 'B-123' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Unit Cost/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Retail Price/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Expiry Date/i), { target: { value: '2025-12-31' } });

    fireEvent.submit(screen.getByTestId('stock-form'));

    await waitFor(() => {
      expect(triggerGlobalToast).toHaveBeenCalledWith('Failed to add stock', 'error');
    });
  });
});
