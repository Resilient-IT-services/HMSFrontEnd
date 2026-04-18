import { describe, it, expect, vi } from 'vitest';
import { authService } from './authService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('authService', () => {
  it('login should call /auth/login', async () => {
    const mockRes = { data: { success: true } };
    (apiClient.post as any).mockResolvedValue(mockRes);

    const result = await authService.login('user', 'pass');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'user', password: 'pass' });
    expect(result).toEqual(mockRes.data);
  });

  it('me should call /auth/me', async () => {
    const mockRes = { data: { success: true, data: { user_id: 1 } } };
    (apiClient.get as any).mockResolvedValue(mockRes);

    const result = await authService.me();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(mockRes.data);
  });

  it('logout should call /auth/logout', async () => {
    const mockRes = { data: { success: true } };
    (apiClient.post as any).mockResolvedValue(mockRes);

    const result = await authService.logout();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(result).toEqual(mockRes.data);
  });

  it('selectHospital should call /auth/select-hospital', async () => {
    const mockRes = { data: { success: true } };
    (apiClient.post as any).mockResolvedValue(mockRes);

    const result = await authService.selectHospital(101);
    expect(apiClient.post).toHaveBeenCalledWith('/auth/select-hospital', { hospital_id: 101 });
    expect(result).toEqual(mockRes.data);
  });
});
