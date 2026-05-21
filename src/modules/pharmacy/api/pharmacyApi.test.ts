import { describe, it, expect, vi } from 'vitest';
import { pharmacyApi } from './pharmacyApi';
import apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('pharmacyApi', () => {
  it('getPrescriptions calls /pharmacy/prescriptions', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getPrescriptions({ search: ' ' });
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/prescriptions', { params: {} });
  });

  it('getPrescriptionById calls /pharmacy/prescriptions/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getPrescriptionById('1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/prescriptions/1');
  });

  it('dispensePrescription calls /pharmacy/prescriptions/:id/dispense', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.dispensePrescription('1', {});
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/prescriptions/1/dispense', {});
  });

  it('getPrescriptionsSummary calls /pharmacy/prescriptions/summary', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getPrescriptionsSummary();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/prescriptions/summary', { params: {} });
  });

  it('getMedicines calls /pharmacy/medicines', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getMedicines();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/medicines', { params: {} });
  });

  it('getMedicinesSummary calls /pharmacy/medicines/summary', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getMedicinesSummary();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/medicines/summary', { params: {} });
  });

  it('importMedicines calls /pharmacy/medicines/import', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const file = new File([], 'test.xlsx');
    await pharmacyApi.importMedicines(file);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/medicines/import', expect.any(FormData), expect.any(Object));
  });

  it('getMedicineStock calls /pharmacy/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getMedicineStock();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/stock', { params: {} });
  });

  it('addMedicine calls /pharmacy/medicines', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.addMedicine({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/medicines', {});
  });

  it('getMedicineById calls /pharmacy/medicines/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getMedicineById('1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/medicines/1');
  });

  it('updateMedicine calls /pharmacy/medicines/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.put).mockResolvedValue(mockRes);
    await pharmacyApi.updateMedicine('1', {} as any);
    expect(apiClient.put).toHaveBeenCalledWith('/pharmacy/medicines/1', {});
  });

  it('deleteMedicine calls /pharmacy/medicines/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.delete).mockResolvedValue(mockRes);
    await pharmacyApi.deleteMedicine('1');
    expect(apiClient.delete).toHaveBeenCalledWith('/pharmacy/medicines/1');
  });

  it('addStock calls /pharmacy/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.addStock({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/stock', {});
  });

  it('updateStock calls /inventory/stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.updateStock({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/stock', {});
  });

  it('importStock calls /pharmacy/stock/import', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    const file = new File([], 'test.xlsx');
    await pharmacyApi.importStock(file);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/stock/import', expect.any(FormData), expect.any(Object));
  });

  it('createSale calls /pharmacy/sales', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.createSale({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/sales', {});
  });

  it('processReturn calls /pharmacy/returns', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.processReturn({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/returns', {});
  });

  it('getLowStockAlerts calls /pharmacy/alerts/low-stock', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getLowStockAlerts();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/alerts/low-stock', expect.any(Object));
  });

  it('getExpiryAlerts calls /pharmacy/alerts/expiry', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getExpiryAlerts();
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/alerts/expiry', expect.any(Object));
  });

  it('getPatientById calls /patients/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getPatientById('1');
    expect(apiClient.get).toHaveBeenCalledWith('/patients/1');
  });

  it('getPatientHistory calls /patients/:id/history', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getPatientHistory('1');
    expect(apiClient.get).toHaveBeenCalledWith('/patients/1/history');
  });

  it('getInventoryItems calls /inventory/items', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getInventoryItems();
    expect(apiClient.get).toHaveBeenCalledWith('/inventory/items', { params: {} });
  });

  it('defineInventoryItem calls /inventory/items', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.defineInventoryItem({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/inventory/items', {});
  });

  it('createQuickSale calls /pharmacy/sales', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.post).mockResolvedValue(mockRes);
    await pharmacyApi.createQuickSale({} as any);
    expect(apiClient.post).toHaveBeenCalledWith('/pharmacy/sales', {});
  });

  it('getSale calls /pharmacy/sales/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getSale('1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/sales/1');
  });

  it('getSaleByPrescription calls /pharmacy/sales/prescription/:id', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.getSaleByPrescription('1');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/sales/prescription/1');
  });

  it('searchRecentCustomers calls /pharmacy/recent-customers', async () => {
    const mockRes = { data: { success: true } };
    vi.mocked(apiClient.get).mockResolvedValue(mockRes);
    await pharmacyApi.searchRecentCustomers('a');
    expect(apiClient.get).toHaveBeenCalledWith('/pharmacy/recent-customers', { params: { search: 'a' } });
  });
});
