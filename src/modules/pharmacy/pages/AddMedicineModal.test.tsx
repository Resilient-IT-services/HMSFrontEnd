import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddMedicineModal from './AddMedicineModal';

vi.mock('../api/pharmacyApi', () => ({
  pharmacyApi: {
    createMedicine: vi.fn(),
  },
}));

vi.mock('@/components/ui/Toast', () => ({
  triggerGlobalToast: vi.fn(),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => isOpen ? (
    <div role="dialog">
      <h2>{title}</h2>
      {children}
    </div>
  ) : null,
}));

describe('AddMedicineModal', () => {
  it('renders HSN Code field', () => {
    render(<AddMedicineModal isOpen={true} onClose={() => {}} onSuccess={vi.fn()} />);
    expect(screen.getByPlaceholderText(/3004/i)).toBeInTheDocument();
  });

  it('updates HSN Code on change', () => {
    render(<AddMedicineModal isOpen={true} onClose={() => {}} onSuccess={vi.fn()} />);
    const hsnInput = screen.getByPlaceholderText(/3004/i) as HTMLInputElement;
    fireEvent.change(hsnInput, { target: { value: '3004', name: 'hsnCode' } });
    expect(hsnInput.value).toBe('3004');
  });
});
