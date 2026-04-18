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
        hospitals: [
          { hospital_id: 1, hospital_name: 'Hospital 1', hospital_code: 'H1', roles: [] }
        ]
      }
    } as any
  }
});

describe('SelectHospitalPage', () => {
  it('renders and allows selection', async () => {
    (authService.selectHospital as any).mockResolvedValue({ success: true, data: {} });

    render(
      <Provider store={createMockStore()}>
        <SelectHospitalPage />
      </Provider>
    );

    expect(screen.getByText('Hospital 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hospital 1'));
    expect(authService.selectHospital).toHaveBeenCalledWith(1);
  });
});
