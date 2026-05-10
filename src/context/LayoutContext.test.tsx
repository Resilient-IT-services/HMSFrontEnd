import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayoutProvider, useLayout } from './LayoutContext';
import React from 'react';

describe('LayoutContext', () => {
  it('provides default values', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LayoutProvider>{children}</LayoutProvider>
    );
    const { result } = renderHook(() => useLayout(), { wrapper });

    expect(result.current.title).toBe('CareFlow');
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('updates title', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LayoutProvider>{children}</LayoutProvider>
    );
    const { result } = renderHook(() => useLayout(), { wrapper });

    act(() => {
      result.current.setTitle('New Title');
    });

    expect(result.current.title).toBe('New Title');
    if (typeof document !== 'undefined') {
      expect(document.title).toBe('New Title | CareFlow');
    }
  });

  it('toggles sidebar', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LayoutProvider>{children}</LayoutProvider>
    );
    const { result } = renderHook(() => useLayout(), { wrapper });

    act(() => {
      result.current.toggleSidebar();
    });
    expect(result.current.isSidebarOpen).toBe(true);

    act(() => {
      result.current.setIsSidebarOpen(false);
    });
    expect(result.current.isSidebarOpen).toBe(false);
  });

  it('sets header actions', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LayoutProvider>{children}</LayoutProvider>
    );
    const { result } = renderHook(() => useLayout(), { wrapper });

    const actions = <button>Action</button>;
    act(() => {
      result.current.setHeaderActions(actions);
    });

    expect(result.current.headerActions).toBe(actions);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useLayout())).toThrow('useLayout must be used within a LayoutProvider');
    consoleSpy.mockRestore();
  });
});
