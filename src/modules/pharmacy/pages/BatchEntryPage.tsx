'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { MedicineResponse, StockRequest } from '@/types/api';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { INDIAN_STATES } from '@/utils/enumOptions';
import { formatCurrency } from '@/utils/formatters';

import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

export const BatchEntryPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineResponse | null>(null);
  const [formData, setFormData] = useState({
    batchNumber: '',
    expiryDate: '',
    manufacturingDate: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    reorderLevel: '',
    hsnCode: '',
    supplier: '',
    supplierState: '',
    taxInclusive: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) {
      triggerGlobalToast('Please select a medicine', 'error');
      return;
    }

    const purchasePrice = Number(formData.purchasePrice);
    const sellingPrice = Number(formData.sellingPrice);

    if (purchasePrice <= 0) {
      triggerGlobalToast('Purchase price must be greater than zero', 'error');
      return;
    }
    if (sellingPrice <= 0) {
      triggerGlobalToast('Selling price must be greater than zero', 'error');
      return;
    }
    if (sellingPrice < purchasePrice) {
      triggerGlobalToast('Selling price cannot be less than purchase price', 'error');
      return;
    }

    // Date Validations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formData.manufacturingDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      if (mfgDate > new Date()) {
        triggerGlobalToast('Manufacturing date cannot be in the future', 'error');
        return;
      }
    }

    if (formData.expiryDate) {
      const expDate = new Date(formData.expiryDate);
      if (expDate < today) {
        triggerGlobalToast('Expiry date cannot be in the past', 'error');
        return;
      }
    }

    if (formData.manufacturingDate && formData.expiryDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);
      if (expDate <= mfgDate) {
        triggerGlobalToast('Expiry date must be after manufacturing date', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const stockRequest: StockRequest = {
        medicineId: selectedMedicine.id,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate || undefined,
        manufacturingDate: formData.manufacturingDate || undefined,
        quantity: Number(formData.quantity),
        purchasePrice,
        sellingPrice,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : undefined,
        hsnCode: formData.hsnCode || undefined,
        supplier: formData.supplier || undefined,
        supplierState: formData.supplierState || undefined,
        taxInclusive: formData.taxInclusive,
      };

      const response = await pharmacyApi.addStock(stockRequest);

      if (response.success) {
        triggerGlobalToast('Batch entered successfully', 'success');
        router.push('/pharmacy/stock');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Stock Entry (Batch-wise)" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Batch Stock Entry"
            description="Register a new inventory batch with expiry and pricing details."
          />
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">New Stock Batch</h2>
                <p className="text-sm text-slate-500">Add a new batch of medicine to the inventory.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Select Medicine</label>
                    <MedicineAutocomplete 
                      onSelect={(m) => {
                        setSelectedMedicine(m);
                        setFormData(prev => ({
                          ...prev,
                          purchasePrice: m.purchasePrice?.toString() || '',
                          sellingPrice: m.sellingPrice?.toString() || '',
                          hsnCode: m.hsnCode || '',
                        }));
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                    {selectedMedicine && (
                      <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-orange-900">{selectedMedicine.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-orange-100 text-[9px] font-black uppercase rounded text-orange-700">
                              {selectedMedicine.form || selectedMedicine.category || 'General'}
                            </span>
                            <p className="text-[10px] text-orange-700 font-bold uppercase">{selectedMedicine.genericName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-orange-700 font-bold uppercase">Current Stock</p>
                          <p className="text-sm font-black text-orange-900">{selectedMedicine.currentStock} Units</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Batch Number</label>
                    <input 
                      required
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      placeholder="e.g. BAT-2026-X1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>



                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Manufacturing Date</label>
                    <input 
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Expiry Date</label>
                    <input 
                      required
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Quantity</label>
                    <input 
                      required
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>



                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Supplier Name</label>
                    <input 
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="e.g. ABC Pharma"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Supplier State</label>
                    <select 
                      name="supplierState"
                      value={formData.supplierState}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all appearance-none"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Purchase Price</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-500 mb-2 ml-1">Selling Price</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6 ml-1">
                    <input 
                      type="checkbox"
                      id="taxInclusive"
                      name="taxInclusive"
                      checked={formData.taxInclusive}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500 transition-all"
                    />
                    <label htmlFor="taxInclusive" className="text-xs font-black uppercase text-slate-700 cursor-pointer">
                      Purchase Price is Tax Inclusive
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium ml-2">
                      (System will back-calculate the taxable amount)
                    </p>
                  </div>

                  {/* Tax Preview Section */}
                  {(formData.purchasePrice && Number(formData.purchasePrice) > 0) && (
                    <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxation Preview</h4>
                        <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase">
                          {formData.taxInclusive ? 'Tax Inclusive' : 'Tax Exclusive'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Base Taxable</p>
                          <p className="text-sm font-black text-slate-700">
                            {(() => {
                              const total = Number(formData.purchasePrice);
                              // This is a rough preview; actual calculation happens on backend
                              // We assume 12% if no specific rule is matched yet, or we could fetch it
                              const rate = selectedMedicine?.taxPercentage || 12;
                              if (formData.taxInclusive) {
                                return formatCurrency(total / (1 + (rate / 100)));
                              }
                              return formatCurrency(total);
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Est. Tax (Total)</p>
                          <p className="text-sm font-black text-slate-700">
                            {(() => {
                              const total = Number(formData.purchasePrice);
                              const rate = selectedMedicine?.taxPercentage || 12;
                              if (formData.taxInclusive) {
                                const base = total / (1 + (rate / 100));
                                return formatCurrency(total - base);
                              }
                              return formatCurrency(total * (rate / 100));
                            })()}
                          </p>
                        </div>
                        <div className="md:col-span-2 flex items-center gap-2">
                           <span className="material-symbols-outlined text-slate-300 text-lg">info</span>
                           <p className="text-[9px] text-slate-400 font-medium leading-tight">
                             Final tax components (CGST/SGST/IGST) will be determined based on your location and supplier state.
                           </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Complete Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
