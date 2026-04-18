import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StoreProvider from './StoreProvider';

describe('StoreProvider', () => {
  it('renders children', () => {
    render(
      <StoreProvider>
        <div data-testid="child">Child</div>
      </StoreProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
