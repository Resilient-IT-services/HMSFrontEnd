import { describe, it, expect, vi } from 'vitest';
import apiClient from './apiClient';

describe('apiClient', () => {
  it('should have correct configuration', () => {
    expect(apiClient.defaults.baseURL).toBe('/api/v1');
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
