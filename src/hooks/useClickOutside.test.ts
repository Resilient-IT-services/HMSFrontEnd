import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('should call handler when clicking outside', () => {
    const handler = vi.fn();
    const map: Record<string, any> = {};
    document.addEventListener = vi.fn((event, cb) => {
      map[event] = cb;
    });

    const div = document.createElement('div');
    const ref = { current: div };

    renderHook(() => useClickOutside(ref, handler));

    // Simulate click outside
    map.mousedown({ target: document.createElement('span') });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when clicking inside', () => {
    const handler = vi.fn();
    const map: Record<string, any> = {};
    document.addEventListener = vi.fn((event, cb) => {
      map[event] = cb;
    });

    const div = document.createElement('div');
    const ref = { current: div };

    renderHook(() => useClickOutside(ref, handler));

    // Simulate click inside
    map.mousedown({ target: div });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useClickOutside({ current: null }, vi.fn()));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });
});
