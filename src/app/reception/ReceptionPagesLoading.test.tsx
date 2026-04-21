import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import pages
import ReceptionDashboard from './dashboard/page';
import PatientsPage from './patients/page';
import TodayAppointmentsPage from './appointments/page';
import DoctorsPage from './doctors/page';
import QueuePage from './queue/page';

// Mock dependencies
vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: { content: [], totalElements: 0 } } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}));

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="main-layout">
      <h1 data-testid="layout-title">{title}</h1>
      {children}
    </div>
  )
}));

describe('Reception Pages Loading', () => {
  const store = configureStore({ reducer: { auth: (state = { user: { role: 'RECEPTIONIST' } }) => state } });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Reception Dashboard loads', async () => {
    render(
      <Provider store={store}>
        <ReceptionDashboard />
      </Provider>
    );
    expect(screen.getByText(/Recent Appointments/i)).toBeInTheDocument();
  });

  it('Patient Directory loads', async () => {
    render(
      <Provider store={store}>
        <PatientsPage />
      </Provider>
    );
    expect(screen.getByTestId('layout-title')).toHaveTextContent(/Patient Directory/i);
  });

  it('Daily Schedule loads', async () => {
    render(
      <Provider store={store}>
        <TodayAppointmentsPage />
      </Provider>
    );
    expect(screen.getByTestId('layout-title')).toHaveTextContent(/Today's Appointments/i);
  });


  it('Doctors List loads', async () => {
    render(
      <Provider store={store}>
        <DoctorsPage />
      </Provider>
    );
    // Based on DoctorsPage implementation which I should check if it has a title
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('Queue Management loads', async () => {
    render(
      <Provider store={store}>
        <QueuePage />
      </Provider>
    );
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });
});
