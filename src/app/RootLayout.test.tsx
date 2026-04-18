import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from './layout';

// Mock client components and providers
vi.mock('@/state/StoreProvider', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/AuthProvider', () => ({ AuthProvider: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/theme/ThemeProvider', () => ({ ThemeProvider: ({ children }: any) => <div>{children}</div> }));

describe('RootLayout', () => {
  it('renders children within providers', () => {
    render(
      <RootLayout>
        <div data-testid="child">Layout Child</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
