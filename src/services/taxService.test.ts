import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taxService } from './taxService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('taxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates taxes', async () => {
    const mockRequest = {
      hospitalId: 'h1',
      itemType: 'MEDICINE',
      quantity: 1,
      unitPrice: 100,
    };
    const mockResponse = {
      success: true,
      data: {
        taxableAmount: 100,
        totalTax: 18,
        grandTotal: 118,
        components: [
          { taxCode: 'CGST', taxName: 'CGST', taxRate: 9, taxAmount: 9 },
          { taxCode: 'SGST', taxName: 'SGST', taxRate: 9, taxAmount: 9 },
        ],
      },
    };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await taxService.calculate(mockRequest);
    expect(apiClient.post).toHaveBeenCalledWith('/tax/calculate', mockRequest);
    expect(result).toEqual(mockResponse);
  });

  it('gets all tax masters', async () => {
    const mockResponse = {
      success: true,
      data: [{ code: 'GST18', name: 'GST 18%', rate: 18, active: true }],
    };

    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

    const result = await taxService.getAllMasters();
    expect(apiClient.get).toHaveBeenCalledWith('/tax/config/masters');
    expect(result).toEqual(mockResponse);
  });

  it('creates a tax master', async () => {
    const mockMaster = { code: 'GST18', name: 'GST 18%', rate: 18, active: true, taxType: 'GST' };
    const mockResponse = { success: true, data: { ...mockMaster, id: '1' } };

    vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

    const result = await taxService.createMaster(mockMaster);
    expect(apiClient.post).toHaveBeenCalledWith('/tax/config/masters', mockMaster);
    expect(result).toEqual(mockResponse);
  });

  it('gets all tax groups', async () => {
    const mockResponse = {
      success: true,
      data: [{ name: 'Standard GST', active: true, taxes: [] }],
    };

    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

    const result = await taxService.getAllGroups();
    expect(apiClient.get).toHaveBeenCalledWith('/tax/config/groups');
    expect(result).toEqual(mockResponse);
  });

  it('gets all tax rules', async () => {
    const mockResponse = {
      success: true,
      data: [{ itemType: 'MEDICINE', taxGroupId: 'g1', priority: 1 }],
    };

    vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

    const result = await taxService.getAllRules();
    expect(apiClient.get).toHaveBeenCalledWith('/tax/config/rules');
    expect(result).toEqual(mockResponse);
  });
});
