import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SelectHospitalPage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';

const mockUser = {
  id: 'user-1',
  fullName: 'Test User',
  memberships: [
    { hospitalId: '1', hospitalName: 'Hospital One', hospitalCode: 'H1', roleAssignments: [] },
    { hospitalId: '2', hospitalName: 'Hospital Two', hospitalCode: 'H2', roleAssignments: [] },
  ],
};

const renderWithRedux = (initialState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { 
      auth: { 
        user: mockUser, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null, 
        isSuperMode: false, 
        activeRole: null, 
        ...initialState 
      } as any 
    },
  });
  return render(
    <Provider store={store}>
      <SelectHospitalPage />
    </Provider>
  );
};

describe('SelectHospitalPage', () => {
  it('renders and allows selection', () => {
    renderWithRedux();
    
    expect(screen.getByText('Hospital One')).toBeInTheDocument();
    expect(screen.getByText('Hospital Two')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Hospital One'));
    // Check if dispatch was called or similar logic
  });
});
