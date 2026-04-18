import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SelectRolePage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';

const createMockStore = () => configureStore({
  reducer: { auth: authReducer },
  preloadedState: {
    auth: {
      user: { roles: ['DOCTOR'] }
    } as any
  }
});

describe('SelectRolePage', () => {
  it('renders and allows selection', () => {
    render(
      <Provider store={createMockStore()}>
        <SelectRolePage />
      </Provider>
    );

    expect(screen.getByText('DOCTOR')).toBeInTheDocument();
    fireEvent.click(screen.getByText('DOCTOR'));
    // activeRole should be updated in store
  });
});
