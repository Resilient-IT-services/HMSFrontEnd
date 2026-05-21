import { describe, it, expect, vi } from 'vitest';
import { pharmacyService } from './pharmacyService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('pharmacyService', () => {
  it('listPrescriptions calls /pharmacy/prescriptions', async () => {
    const mockRes = { data: { success: true, data: { content: [] } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.listPrescriptions();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/prescriptions');
    expect(result).toEqual(mockRes.data);
  });

  it('listMedicinesSummary calls /pharmacy/medicines/summary', async () => {
    const mockRes = { data: { success: true, data: { content: [] } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const params = { search: 'test', page: 1 };
    const result = await pharmacyService.listMedicinesSummary(params);
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/medicines/summary', { params });
    expect(result).toEqual(mockRes.data);
  });

  it('dispensePrescription calls /pharmacy/prescriptions/:id/dispense', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const request = { items: [], payment: { mode: 'CASH', amount: 100 } } as any;
    const result = await pharmacyService.dispensePrescription('rx-1', request);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/prescriptions/rx-1/dispense', request);
    expect(result).toEqual(mockRes.data);
  });

  it('searchRecentCustomers calls /pharmacy/recent-customers', async () => {
    const mockRes = { data: { success: true, data: [] } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.searchRecentCustomers('john');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/recent-customers', { params: { search: 'john' } });
    expect(result).toEqual(mockRes.data);
  });

  it('getExpiryAlerts calls /pharmacy/alerts/expiry', async () => {
    const mockRes = { data: { success: true, data: [] } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.getExpiryAlerts(60);
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/alerts/expiry', { params: { days: 60 } });
    expect(result).toEqual(mockRes.data);
  });

  it('getLowStockAlerts calls /pharmacy/alerts/low-stock', async () => {
    const mockRes = { data: { success: true, data: { content: [] } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const params = { threshold: 10 };
    const result = await pharmacyService.getLowStockAlerts(params);
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/alerts/low-stock', { params });
    expect(result).toEqual(mockRes.data);
  });

  it('getPrescription calls /pharmacy/prescriptions/:id', async () => {
    const mockRes = { data: { success: true, data: {} } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.getPrescription('rx-1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/prescriptions/rx-1');
    expect(result).toEqual(mockRes.data);
  });

  it('addStock calls /pharmacy/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const request = { medicineId: 'med-1', quantity: 10 } as any;
    const result = await pharmacyService.addStock(request);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/stock', request);
    expect(result).toEqual(mockRes.data);
  });

  it('addMedicine calls /pharmacy/medicines', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const request = { name: 'Med' } as any;
    const result = await pharmacyService.addMedicine(request);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/medicines', request);
    expect(result).toEqual(mockRes.data);
  });

  it('updateMedicine calls /pharmacy/medicines/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.put).mockResolvedValue(mockRes);
    const request = { name: 'Med' } as any;
    const result = await pharmacyService.updateMedicine('med-1', request);
    expect(apiClient.put).toHaveBeenCalledWith('/pharmacy/medicines/med-1', request);
    expect(result).toEqual(mockRes.data);
  });

  it('deleteMedicine calls /pharmacy/medicines/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.delete).mockResolvedValue(mockRes);
    const result = await pharmacyService.deleteMedicine('med-1');
    expect(apiClient.delete).toHaveBeenCalledWith('/pharmacy/medicines/med-1');
    expect(result).toEqual(mockRes.data);
  });

  it('getSale calls /pharmacy/sales/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.getSale('sale-1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/sales/sale-1');
    expect(result).toEqual(mockRes.data);
  });

  it('getSaleByPrescription calls /pharmacy/sales/prescription/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.getSaleByPrescription('rx-1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/sales/prescription/rx-1');
    expect(result).toEqual(mockRes.data);
  });

  it('getLowStockCount handles success', async () => {
    const mockRes = { data: { success: true, message: 'OK', data: { totalElements: 5 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    const result = await pharmacyService.getLowStockCount();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/stock', { params: { lowStock: true, size: 1 } });
    expect(result).toEqual({ success: true, message: 'OK', data: { totalElements: 5 } });
  });

  it('createPrescription calls /pharmacy/prescriptions', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyService.createPrescription({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/prescriptions', {});
  });

  it('listStock calls /pharmacy/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyService.listStock({ lowStock: true });
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/stock', { params: { lowStock: true } });
  });

  it('importMaster calls /pharmacy/medicines/import', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const file = new File([], 'test.xlsx');
    await pharmacyService.importMaster(file);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/medicines/import', expect.any(FormData), expect.any(Object));
  });

  it('importStock calls /pharmacy/stock/import', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const file = new File([], 'test.xlsx');
    await pharmacyService.importStock(file);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/stock/import', expect.any(FormData), expect.any(Object));
  });

  it('processSale calls /pharmacy/sales', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyService.processSale({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/sales', {});
  });

  it('processReturn calls /pharmacy/returns', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyService.processReturn({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/returns', {});
  });

  it('listInventoryItems calls /inventory/items', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyService.listInventoryItems();
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/items', { params: undefined });
  });

  it('listInventoryStock calls /inventory/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyService.listInventoryStock();
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/stock', { params: undefined });
  });

  it('defineInventoryItem calls /inventory/items', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyService.defineInventoryItem({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/items', {});
  });

  it('updateStock calls /inventory/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyService.updateStock({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/stock', {});
  });
});
