import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PharmacyDashboard from './page';
import apiClient from '@/services/apiClient';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/apiClient', () => ({
  default: { get: vi.fn() }
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

describe('PharmacyDashboard', () => {
  it('renders correctly', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [] }
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = {}) => state } })}>
        <PharmacyDashboard />
      </Provider>
    );

    expect(screen.getByText(/Prescription Queue/i)).toBeInTheDocument();
  });
});
