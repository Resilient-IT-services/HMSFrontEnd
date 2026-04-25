import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Topbar from './Topbar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';

// Mock GlobalSearch to simplify Topbar testing
vi.mock('./GlobalSearch', () => ({
  default: () => <div data-testid="global-search">Search</div>
}));

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  fullName: 'Test User',
  roles: ['DOCTOR'],
  memberships: [
    { hospitalId: '1', hospitalName: 'Test Hospital', hospitalCode: 'TH', roleAssignments: [] }
  ],
  currentHospitalId: '1'
};

import { LayoutProvider } from '@/context/LayoutContext';

const renderWithRedux = (initialState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { 
      user: mockUser, 
      isAuthenticated: true, 
      activeRole: 'DOCTOR',
      isSuperMode: false,
      ...initialState 
    } },
  });
  return render(
    <Provider store={store}>
      <LayoutProvider>
        <Topbar />
      </LayoutProvider>
    </Provider>
  );
};

describe('Topbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and username', () => {
    renderWithRedux();
    expect(screen.getByText('VitalSync HMS')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Test Hospital')).toBeInTheDocument();
  });

  it('opens profile dropdown on click', () => {
    renderWithRedux();
    const profileButton = screen.getByText('testuser').closest('button');
    fireEvent.click(profileButton!);
    expect(screen.getByText('Signed in as')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles hospital switch', () => {
    const multiHospitalUser = {
      ...mockUser,
      memberships: [
        { hospitalId: '1', hospitalName: 'Hosp 1', hospitalCode: 'H1', roleAssignments: [] },
        { hospitalId: '2', hospitalName: 'Hosp 2', hospitalCode: 'H2', roleAssignments: [] }
      ]
    };
    renderWithRedux({ user: multiHospitalUser });
    const profileButton = screen.getByText('testuser').closest('button');
    fireEvent.click(profileButton!);
    
    expect(screen.getByText('Hosp 2')).toBeInTheDocument();
  });
});
