'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PrescriptionDTO, MedicineResponse } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import { triggerGlobalToast } from '@/components/ui/Toast';
import StatusBadge from '@/modules/pharmacy/components/StatusBadge';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { Badge } from '@/components/ui/Badge';

interface BillItem {
  key: string;
  id: string;
  name: string;
  dosage: string;
  duration: string;
  quantity: number;
  price: number;
  isManual: boolean;
  outOfStock: boolean;
  totalAvailable: number;
}

interface PrescriptionDetailPageProps {
  id: string;
}

const PrescriptionDetailPage: React.FC<PrescriptionDetailPageProps> = ({ id }) => {
  const router = useRouter();
  
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  // Robust price & stock resolver
  const resolveStockAndPrice = async (medicineId: string, medicineName: string) => {
    let price = 0;
    let totalAvailable = 0;
    
    try {
      // 1. Check Stock first
      const stockRes = await pharmacyApi.getMedicineStock({ 
        medicineId: medicineId || undefined,
        search: medicineId ? undefined : medicineName 
      });

      if (stockRes.success && stockRes.data?.content) {
        // If searched by name, filter carefully
        const matches = medicineId 
          ? stockRes.data.content 
          : stockRes.data.content.filter(s => s.medicineName.toLowerCase() === medicineName.toLowerCase());
        
        totalAvailable = matches.reduce((acc, s) => acc + (s.quantity || 0), 0);
        
        if (totalAvailable > 0) {
          const firstAvailable = matches.find(s => (s.quantity || 0) > 0);
          price = firstAvailable?.sellingPrice || firstAvailable?.price || 0;
        }
      }
      
      // 2. Fallback to Medicine Master for price if stock is 0 or price not in stock record
      if (price === 0 && medicineId) {
        const medRes = await pharmacyApi.getMedicineById(medicineId);
        if (medRes.success && medRes.data) {
          price = medRes.data.sellingPrice || medRes.data.purchasePrice || 0;
        }
      }
    } catch (error) {
      console.error('Stock/Price resolution failed', error);
    }
    
    return { price, totalAvailable, outOfStock: totalAvailable === 0 };
  };

  // Initial Load & Persistence
  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const saved = sessionStorage.getItem(`rx_draft_${id}`);
        const rxRes = await pharmacyApi.getPrescriptionById(id);
        
        if (rxRes.success && rxRes.data) {
          setPrescription(rxRes.data);
          
          if (saved) {
            setBillItems(JSON.parse(saved));
          } else {
            // Initialize from prescription
            const items = await Promise.all(rxRes.data.items.map(async (item, idx) => {
              const { price, totalAvailable, outOfStock } = await resolveStockAndPrice(item.medicineId || '', item.medicineName);
              return {
                key: `api-${item.medicineId || idx}-${Date.now()}`,
                id: item.medicineId || '',
                name: item.medicineName,
                dosage: item.dosage,
                duration: item.duration,
                quantity: outOfStock ? 0 : 1,
                price: price,
                isManual: false,
                outOfStock,
                totalAvailable
              };
            }));
            setBillItems(items);
          }
        }
      } catch (error) {
        console.error(error);
        triggerGlobalToast('Failed to load prescription', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // Sync state to session
  useEffect(() => {
    if (billItems.length > 0 && id) {
      sessionStorage.setItem(`rx_draft_${id}`, JSON.stringify(billItems));
    }
  }, [billItems, id]);

  const handleAddMedicine = async (medicine: MedicineResponse) => {
    const { price, totalAvailable, outOfStock } = await resolveStockAndPrice(medicine.id, medicine.name);

    const newItem: BillItem = {
      key: `manual-${medicine.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      id: medicine.id,
      name: medicine.name,
      dosage: '-',
      duration: '-',
      quantity: outOfStock ? 0 : 1,
      price: price,
      isManual: true,
      outOfStock,
      totalAvailable
    };

    setBillItems(prev => [...prev, newItem]);
    if (outOfStock) {
      triggerGlobalToast(`${medicine.name} is currently out of stock`, 'warning');
    } else {
      triggerGlobalToast(`${medicine.name} added to bill`, 'success');
    }
  };

  const handleRemoveItem = (key: string) => {
    const updated = billItems.filter(item => item.key !== key);
    setBillItems(updated);
    if (updated.length === 0 && id) {
      sessionStorage.removeItem(`rx_draft_${id}`);
    }
  };

  const handleQuantityChange = (key: string, value: string) => {
    const item = billItems.find(i => i.key === key);
    if (item?.outOfStock) return; // Prevent modification if out of stock

    const qty = Math.max(0, Number.parseInt(value) || 0);
    
    // Optional: cap at totalAvailable
    if (item && qty > item.totalAvailable) {
      triggerGlobalToast(`Only ${item.totalAvailable} units available in stock`, 'warning');
      return;
    }

    setBillItems(prev => prev.map(item => 
      item.key === key ? { ...item, quantity: qty } : item
    ));
  };

  const subtotal = billItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const tax = subtotal * 0.12;
  const grandTotal = subtotal + tax;

  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');

  const handleDispense = async () => {
    if (!id || !prescription) return;

    // Filter valid items: must have ID, not be out of stock, and have quantity > 0
    const validItems = billItems.filter(item => 
      item.id && 
      item.id.trim() !== '' && 
      !item.outOfStock && 
      item.quantity > 0
    );
    
    if (validItems.length === 0) {
      triggerGlobalToast('No valid in-stock medicines selected. Out-of-stock items cannot be dispensed.', 'error');
      return;
    }
    
    try {
      setDispensing(true);
      const payload = {
        patientId: prescription.patientId,
        prescriptionId: prescription.id,
        items: validItems.map(item => ({
          medicineId: item.id,
          quantity: item.quantity
        })),
        payment: {
          mode: paymentMode,
          referenceNumber: `AUTO-${Date.now()}`
        }
      };

      const res = await pharmacyApi.dispensePrescription(id, payload);
      if (res.success) {
        triggerGlobalToast('Prescription dispensed successfully, bill generated and paid.', 'success');
        sessionStorage.removeItem(`rx_draft_${id}`);
        // Refresh prescription data
        const rxRes = await pharmacyApi.getPrescriptionById(id);
        if (rxRes.success && rxRes.data) {
          setPrescription(rxRes.data);
          // Re-initialize bill items to reflect new stock levels or completion
          router.refresh();
        }
      } else {
        triggerGlobalToast(res.message || 'Dispensing failed', 'error');
      }
    } catch (error: any) {
      console.error(error);
      triggerGlobalToast(error.response?.data?.message || 'Dispensing failed', 'error');
    } finally {
      setDispensing(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!id) return;
    router.push(`/pharmacy/sales/prescription/${id}`);
  };

  if (loading) return <MainLayout title="Loading..."><LoadingSkeleton /></MainLayout>;
  if (!prescription) return <MainLayout title="Not Found"><div>Prescription not found</div></MainLayout>;
  const isFinalized = prescription.status === 'COMPLETED' || prescription.status === 'DISPENSED';

  return (
    <MainLayout title={`Dispense Order: #RX-${id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Patient Info */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Patient</p>
                <p className="text-lg font-bold text-slate-900">{prescription.patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined">stethoscope</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Doctor</p>
                <p className="text-lg font-bold text-slate-900">{prescription.doctorName}</p>
              </div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={prescription.status || 'ACTIVE'} />
            </div>
          </section>

          {/* Prescribed Items Reference */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Doctor's Original Prescription</h2>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {prescription.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-800 text-sm">{item.medicineName}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{item.dosage} • {item.duration}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Active Billing Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800">Billing & Dispensing</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Adjust quantities or add medicines</p>
              </div>
              <div className="w-72">
                <MedicineAutocomplete 
                  onSelect={handleAddMedicine} 
                  placeholder="Add extra medicines..." 
                  stockOnly={true}
                />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {billItems.map((item) => (
                  <div key={item.key} className={`flex items-center gap-4 p-4 border rounded-xl transition-colors group ${
                    item.outOfStock ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-orange-200'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${item.outOfStock ? 'text-slate-500' : 'text-slate-900'}`}>{item.name}</p>
                        {item.isManual && <Badge variant="blue" className="text-[8px]">Manual</Badge>}
                        {item.outOfStock && <Badge variant="red" className="text-[8px] uppercase">Out of Stock</Badge>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.dosage} • {item.duration}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 border-l border-r border-slate-100">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => handleQuantityChange(item.key, e.target.value)}
                        className={`w-14 px-2 py-1 border rounded text-sm text-center font-bold outline-none focus:border-orange-500 ${
                          item.outOfStock ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                        min="0"
                        disabled={item.outOfStock}
                      />
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Units</span>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Rate: ₹{(Number(item.price) || 0).toFixed(2)}</p>
                      <p className={`text-sm font-black ${item.outOfStock ? 'text-slate-400' : 'text-slate-900'}`}>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.key)}
                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Item"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}

                {billItems.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                    <p className="text-sm font-medium">No items in bill. Search to add.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl sticky top-24">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-slate-600 font-bold">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium italic">
                <span>GST (12%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                <span className="text-xs font-black text-slate-800 uppercase">Grand Total</span>
                <span className="text-3xl font-black text-orange-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {!isFinalized && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'CARD', 'UPI'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                        paymentMode === mode 
                          ? 'bg-orange-50 border-orange-200 text-orange-700' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isFinalized ? (
              <button 
                onClick={handlePrintInvoice}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">print</span>
                Print Invoice
              </button>
            ) : (
              <button 
                onClick={handleDispense}
                disabled={dispensing || billItems.length === 0}
                className="w-full py-4 bg-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payments</span>
                {dispensing ? 'Finalizing...' : 'Complete Dispensing'}
              </button>
            )}
            
            <button 
              onClick={() => globalThis.print()}
              className="w-full mt-3 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">print</span> Print Draft Bill
            </button>
          </section>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-blue-600">verified_user</span>
            <p className="text-[10px] text-blue-800 font-medium">Draft saved automatically. Your progress is safe even if you refresh.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrescriptionDetailPage;
