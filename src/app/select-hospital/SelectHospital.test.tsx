import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SelectHospitalPage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';

vi.mock('@/services/authService');

const createMockStore = () => configureStore({
  reducer: { auth: authReducer },
  preloadedState: {
    auth: {
      user: {
        memberships: [
          { hospitalId: "101", hospitalName: 'Hospital 1', hospitalCode: 'H1', roles: [] }
        ]
      }
    } as any
  }
});

describe('SelectHospitalPage', () => {
  it('renders and allows selection', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <SelectHospitalPage />
      </Provider>
    );

    expect(screen.getByText('Hospital 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hospital 1'));
    
    expect(store.getState().auth.user?.currentHospitalId).toBe("101");
  });
});
