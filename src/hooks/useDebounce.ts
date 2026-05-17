import { useEffect, useState, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const lastValueRef = useRef<T>(value);

  useEffect(() => {
    // If the value is the same as the last debounced value, don't restart the timer
    if (value === lastValueRef.current) return;

    const handler = setTimeout(() => {
      lastValueRef.current = value;
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
