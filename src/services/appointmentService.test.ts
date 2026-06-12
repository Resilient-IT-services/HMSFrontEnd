import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appointmentService } from './appointmentService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('appointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list() should fetch appointments with correct params', async () => {
    const mockData = { success: true, data: { content: [], totalElements: 0 } };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const params = { doctorId: 'doc-123', page: 1 };
    const result = await appointmentService.list(params);

    expect(apiClient.get).toHaveBeenCalledWith('/appointments', {
      params: { page: 1, size: 20, doctorId: 'doc-123' },
    });
    expect(result).toEqual(mockData);
  });

  it('get() should fetch a single appointment by ID', async () => {
    const mockData = { success: true, data: { id: 'app-123' } };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await appointmentService.get('app-123');

    expect(apiClient.get).toHaveBeenCalledWith('/appointments/app-123');
    expect(result).toEqual(mockData);
  });

  it('create() should post a new appointment', async () => {
    const request = { patientId: 'pat-123', doctorId: 'doc-123' } as any;
    const mockData = { success: true, data: { id: 'app-123', ...request } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await appointmentService.create(request);

    expect(apiClient.post).toHaveBeenCalledWith('/appointments', request, undefined);
    expect(result).toEqual(mockData);
  });

  it('updateStatus() should post status update', async () => {
    const request = { status: 'CANCELLED' } as any;
    const mockData = { success: true, data: { id: 'app-123', status: 'CANCELLED' } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await appointmentService.updateStatus('app-123', request);

    expect(apiClient.post).toHaveBeenCalledWith('/appointments/app-123/status', request, undefined);
    expect(result).toEqual(mockData);
  });

  it('patchVitals() should patch vitals data', async () => {
    const vitals = { weight: 70, heartRate: 72 } as any;
    const mockData = { success: true, data: { id: 'app-123', vitals } };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: mockData });

    const result = await appointmentService.patchVitals('app-123', vitals);

    expect(apiClient.patch).toHaveBeenCalledWith('/appointments/app-123/vitals', vitals, undefined);
    expect(result).toEqual(mockData);
  });
});
