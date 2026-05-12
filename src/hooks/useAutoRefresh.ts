'use client';

import { useEffect } from 'react';

/**
 * A custom hook to handle periodic data refreshing (polling).
 * @param refreshFn The function to call periodically.
 * @param intervalMs The polling interval in milliseconds (default is 30,000ms).
 * @param enabled Whether polling is active (default is true).
 */
export const useAutoRefresh = (
  refreshFn: (isBackground?: boolean) => void | Promise<void>,
  intervalMs: number = 30_000,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      void refreshFn(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [refreshFn, intervalMs, enabled]);
};
