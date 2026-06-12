import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patientService } from './patientService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('patientService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list() should fetch patients with correct params', async () => {
    const mockData = { success: true, data: { content: [], totalElements: 0 } };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const params = { search: 'John', page: 1 };
    const result = await patientService.list(params);

    expect(apiClient.get).toHaveBeenCalledWith('/patients', {
      params: { page: 1, size: 20, search: 'John' },
    });
    expect(result).toEqual(mockData);
  });

  it('get() should fetch a single patient by ID', async () => {
    const mockData = { success: true, data: { id: 'pat-123', fullName: 'John Doe' } };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await patientService.get('pat-123');

    expect(apiClient.get).toHaveBeenCalledWith('/patients/pat-123');
    expect(result).toEqual(mockData);
  });

  it('create() should post a new patient', async () => {
    const request = { fullName: 'John Doe', phone: '1234567890' } as any;
    const mockData = { success: true, data: { id: 'pat-123', ...request } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

    const result = await patientService.create(request);

    expect(apiClient.post).toHaveBeenCalledWith('/patients', request);
    expect(result).toEqual(mockData);
  });

  it('update() should put patient updates', async () => {
    const request = { phone: '0987654321' } as any;
    const mockData = { success: true, data: { id: 'pat-123', fullName: 'John Doe', ...request } };
    vi.mocked(apiClient.put).mockResolvedValue({ data: mockData });

    const result = await patientService.update('pat-123', request);

    expect(apiClient.put).toHaveBeenCalledWith('/patients/pat-123', request);
    expect(result).toEqual(mockData);
  });

  it('getPrescriptions() should fetch patient prescriptions', async () => {
    const mockData = { success: true, data: [{ id: 'pres-1' }] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const result = await patientService.getPrescriptions('pat-123');

    expect(apiClient.get).toHaveBeenCalledWith('/patients/pat-123/prescriptions');
    expect(result).toEqual(mockData);
  });
});
