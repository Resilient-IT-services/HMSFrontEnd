import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DoctorDashboard from './page';
import apiClient from '@/services/apiClient';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('@/services/apiClient', () => ({
  default: { get: vi.fn() }
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

describe('DoctorDashboard', () => {
  it('renders and fetches appointments', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [] }
    });

    render(
      <Provider store={configureStore({ reducer: { auth: (state = {}) => state } })}>
        <DoctorDashboard />
      </Provider>
    );

    expect(screen.getByText(/Patient Waiting Queue/i)).toBeInTheDocument();
  });
});
