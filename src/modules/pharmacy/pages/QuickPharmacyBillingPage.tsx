'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import {
  QuickPharmacySaleRequest,
  PharmacyStockDTO,
  PatientResponse,
  DoctorStaffResponse
} from '@/types/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatters';
import { useRouter, useSearchParams } from 'next/navigation';
import MedicineStockSearch from '../components/MedicineStockSearch';
import PatientSearch from '../components/PatientSearch';
import DoctorSearch from '../components/DoctorSearch';
import MainLayout from '@/components/ui/MainLayout';
import { PHARMACY_SALE_TYPE_OPTIONS } from '@/utils/enumOptions';
import { PageSurface } from '@/components/ui/PageSurface';

import { doctorService } from '@/services/doctorService';

interface CartItem {
  id?: string;
  medicineId?: string;
  medicineName: string;
  batchNumber?: string;
  sellingPrice?: number;
  quantity: number; // available quantity in stock
  selectedQuantity: number; // quantity to be sold
  discount: number;
  isOutOfStock?: boolean;
  isExpired?: boolean;
}

const findBatchesToFulfill = async (medicineName: string, prescribedQty: number): Promise<{ batches: CartItem[], remaining: number }> => {
  try {
    const stockRes = await pharmacyApi.getMedicineStock({ search: medicineName, size: 5 });
    const batches: CartItem[] = [];
    let remaining = prescribedQty;

    if (stockRes.success && stockRes.data?.content?.length) {
      const now = new Date();
      // Filter out expired stock first
      const validStock = stockRes.data.content.filter(s => !s.expiryDate || new Date(s.expiryDate) > now);

      for (const batch of validStock) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, batch.quantity);
        if (take > 0) {
          batches.push({ 
            ...batch, 
            selectedQuantity: take, 
            discount: 0,
            isOutOfStock: false,
            isExpired: false
          });
          remaining -= take;
        }
      }
    }
    return { batches, remaining };
  } catch (error) {
    console.error('Error finding batches:', error);
    return { batches: [], remaining: prescribedQty };
  }
};

interface PrescriptionResponse {
  id: string;
  patientId: string;
  doctorId?: string;
  doctorName?: string;
  visitId?: string;
  status?: string;
  items: Array<{
    medicineId?: string;
    medicineName: string;
  }>;
}

export default function QuickPharmacyBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const initialized = useRef(false);

  const [saleType, setSaleType] = useState<'WALKIN' | 'VISIT'>(() => {
    const rxId = searchParams.get('prescriptionId');
    const pid = searchParams.get('patientId');
    return (rxId || pid) ? 'VISIT' : 'WALKIN';
  });
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [externalDoctorName, setExternalDoctorName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescriptionStatus, setPrescriptionStatus] = useState<string | null>(null);
  const [prescribedDoctorId, setPrescribedDoctorId] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + ((item.sellingPrice || 0) * item.selectedQuantity), 0), [cart]);
  const totalDiscount = useMemo(() => cart.reduce((acc, item) => acc + item.discount, 0), [cart]);
  const totalAmount = useMemo(() => subtotal - totalDiscount, [subtotal, totalDiscount]);

  const [prevTotalAmount, setPrevTotalAmount] = useState(totalAmount);
  if (totalAmount !== prevTotalAmount) {
    setAmountPaid(totalAmount);
    setPrevTotalAmount(totalAmount);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const loadPrescriptionData = async (rxId: string) => {
    setPrescriptionId(rxId);
    const res = await pharmacyApi.getPrescriptionById(rxId);
    if (res.success && res.data) {
      const rx = res.data;
      setPrescriptionStatus(rx.status || 'PENDING');
      
      // Handle Doctor
      if (rx.doctorId) {
        setPrescribedDoctorId(rx.doctorId);
        try {
          const docRes = await doctorService.get(rx.doctorId);
          if (docRes.success && docRes.data) {
            setSelectedDoctor(docRes.data);
          } else {
            setExternalDoctorName(rx.doctorName || '');
          }
        } catch {
          setExternalDoctorName(rx.doctorName || '');
        }
      } else {
        setExternalDoctorName(rx.doctorName || '');
      }

      setVisitId(rx.visitId || null);

      if (rx.patientId) {
        const pRes = await pharmacyApi.getPatientById(rx.patientId);
        if (pRes?.success && pRes.data) setSelectedPatient(pRes.data);
      }

      const newItems: CartItem[] = [];
      for (const rxItem of rx.items) {
        const { batches, remaining } = await findBatchesToFulfill(rxItem.medicineName, 1);
        if (batches.length > 0) {
          newItems.push(...batches);
        }
        
        if (remaining > 0) {
          // Add as out-of-stock item
          newItems.push({
            medicineName: rxItem.medicineName,
            medicineId: rxItem.medicineId,
            quantity: 0,
            selectedQuantity: remaining,
            discount: 0,
            isOutOfStock: true,
            isExpired: false,
            batchNumber: 'N/A',
            sellingPrice: 0
          });
          triggerGlobalToast(`Insufficient stock for ${rxItem.medicineName}.`, 'warning');
        }
      }
      setCart(prev => [...prev, ...newItems]);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    const rxId = searchParams.get('prescriptionId');
    const pid = searchParams.get('patientId');

    if (rxId || pid) {
      initialized.current = true;
      const load = async () => {
        try {
          if (rxId) await loadPrescriptionData(rxId);
          else if (pid) {
            const pRes = await pharmacyApi.getPatientById(pid);
            if (pRes.success && pRes.data) setSelectedPatient(pRes.data);
          }
        } catch (error) {
          console.error(error);
          triggerGlobalToast('Failed to load details', 'error');
        }
      };
      load();
    }
  }, [searchParams]);

  const addToCart = (stock: PharmacyStockDTO) => {
    const existingIndex = cart.findIndex(item => item.id === stock.id);
    if (existingIndex === -1) {
      const now = new Date();
      const isExpired = stock.expiryDate ? new Date(stock.expiryDate) < now : false;
      
      setCart([...cart, { 
        ...stock, 
        selectedQuantity: 1, 
        discount: 0, 
        isOutOfStock: stock.quantity <= 0,
        isExpired
      }]);
    } else {
      const newCart = [...cart];
      if (newCart[existingIndex].selectedQuantity < stock.quantity) {
        newCart[existingIndex].selectedQuantity += 1;
        setCart(newCart);
      } else {
        triggerGlobalToast('Insufficient stock in this batch', 'error');
      }
    }
  };

  const updateQuantity = (index: number, qty: number) => {
    const item = cart[index];
    if (item.isOutOfStock || item.isExpired) return;

    const newCart = [...cart];
    const stockQty = newCart[index].quantity;
    const safeQty = Math.max(1, Math.min(qty, stockQty));
    if (qty > stockQty) triggerGlobalToast(`Only ${stockQty} units available`, 'warning');
    newCart[index].selectedQuantity = safeQty;
    setCart(newCart);
  };

  const updateDiscount = (index: number, discount: number) => {
    const item = cart[index];
    if (item.isOutOfStock || item.isExpired) return;

    const newCart = [...cart];
    const itemTotal = (item.sellingPrice || 0) * item.selectedQuantity;
    const safeDiscount = Math.max(0, Math.min(discount, itemTotal));
    if (discount > itemTotal) triggerGlobalToast(`Discount cannot exceed total amount`, 'error');
    newCart[index].discount = safeDiscount;
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (isSubmitting || cart.length === 0) return;
    
    // Filter out invalid items for the final payload
    const validItems = cart.filter(item => !item.isOutOfStock && !item.isExpired && item.id);
    
    if (validItems.length === 0) {
      triggerGlobalToast('No valid items in cart to sell', 'error');
      return;
    }

    if (saleType === 'WALKIN' && (!customerName || !/^[6-9]\d{9}$/.test(customerPhone))) {
      triggerGlobalToast('Valid name and phone required', 'error');
      return;
    }
    if (saleType === 'VISIT' && (!selectedPatient || !selectedDoctor)) {
      triggerGlobalToast('Patient and Doctor required', 'error');
      return;
    }

    const finalTotal = Number(totalAmount.toFixed(2));
    const finalPaid = Number(amountPaid.toFixed(2));

    if (finalPaid < finalTotal) {
      triggerGlobalToast('Paid amount cannot be less than total', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: QuickPharmacySaleRequest = {
        saleType,
        patientId: selectedPatient?.id,
        visitId: visitId || undefined,
        prescriptionId: prescriptionId || undefined,
        doctorId: selectedDoctor?.userId || prescribedDoctorId || undefined,
        externalDoctorName,
        customerName: saleType === 'WALKIN' ? customerName : selectedPatient?.fullName,
        customerPhone: saleType === 'WALKIN' ? customerPhone : selectedPatient?.phone,
        items: validItems.map(item => ({
          medicineBatchId: item.id!,
          quantity: item.selectedQuantity,
          discountAmount: Number(item.discount.toFixed(2)),
          taxAmount: 0
        })),
        payment: { mode: paymentMode as any, amount: finalPaid, referenceNumber },
        notes: ''
      };

      const response = await pharmacyApi.createQuickSale(payload);
      if (response.success && response.data) {
        triggerGlobalToast('Sale completed successfully', 'success');
        router.push(`/pharmacy/sales/${response.data.saleId}`);
      } else {
        triggerGlobalToast(response.message || 'Failed to create sale', 'error');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error(error);
      triggerGlobalToast(error.response?.data?.message || 'An error occurred', 'error');
      setIsSubmitting(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 mb-4 shrink-0">
      <div className="min-w-0">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">Quick Patient Visit Pharmacy Billing</h1>
        {prescriptionId && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-block text-[9px] font-black text-orange-700 uppercase bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              Prescription: #RX-{prescriptionId.substring(0, 8).toUpperCase()}
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
              prescriptionStatus === 'PENDING' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              prescriptionStatus === 'DISPENSED' ? 'bg-green-100 text-green-700 border-green-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {prescriptionStatus || 'PENDING'}
            </span>
          </div>
        )}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner shrink-0 w-full xl:w-auto">
        {PHARMACY_SALE_TYPE_OPTIONS.map((option) => (
            <button
                key={option.value}
                onClick={() => setSaleType(option.value)}
                className={`flex-1 xl:flex-none px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${saleType === option.value ? 'bg-white shadow-md text-orange-700' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {option.label}
            </button>
        ))}
      </div>
    </div>
  );

  return (
      <MainLayout title="Pharmacy Billing" hideTitle>
        <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
          {renderHeader()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)] overflow-hidden items-start">
            <div className="lg:col-span-2 space-y-4 h-full flex flex-col min-h-0">
              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {saleType === 'VISIT' ? (
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Patient Lookup</label>
                        <PatientSearch onSelect={setSelectedPatient} defaultValue={selectedPatient?.fullName} />
                      </div>
                  ) : (
                      <>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Customer Name</label>
                          <input
                              type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in name"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Phone Number</label>
                          <input
                              type="tel" maxLength={10} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replaceAll(/\D/g, ''))} placeholder="10-digit number"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500"
                          />
                        </div>
                      </>
                  )}
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Doctor (Hospital)</label>
                    <DoctorSearch onSelect={setSelectedDoctor} defaultValue={selectedDoctor?.fullName} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">External Refer Doctor</label>
                    <input
                        type="text" value={externalDoctorName} onChange={(e) => setExternalDoctorName(e.target.value)} placeholder="e.g. Dr. Sharma"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-nowrap sm:flex-row justify-between items-center gap-2 shrink-0">
                  <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Medication Table</h2>
                  <div className="w-full sm:w-64 shrink-0">
                    <MedicineStockSearch onSelect={addToCart} stockOnly={true} />
                  </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1 min-h-0 scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-white z-10 border-b pb-2">
                    <tr className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="pb-2 px-2">Medicine / Batch</th>
                      <th className="pb-2 px-2 text-center">Stock</th>
                      <th className="pb-2 px-2 text-center">Quantity</th>
                      <th className="pb-2 px-2 text-right">Price</th>
                      <th className="pb-2 px-2 text-right">Discount</th>
                      <th className="pb-2 px-2 text-right">Total</th>
                      <th className="pb-2 px-2 text-center w-10"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {cart.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-300 font-medium">
                            <span className="material-symbols-outlined text-4xl block mb-1">shopping_cart</span>
                            Terminal cart empty. Search stock items above.
                          </td>
                        </tr>
                    ) : cart.map((item, index) => (
                        <tr key={`${item.id || item.medicineName}-${index}`} className={`border-b border-slate-50 transition-colors ${item.isOutOfStock || item.isExpired ? 'bg-red-50/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold ${item.isOutOfStock || item.isExpired ? 'text-red-700' : 'text-slate-800'}`}>{item.medicineName}</p>
                              {item.isOutOfStock && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded">Out of Stock</span>}
                              {item.isExpired && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded">Expired</span>}
                            </div>
                            <p className="text-[9px] font-mono text-orange-600 font-bold uppercase">Batch: #{item.batchNumber || 'N/A'}</p>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.quantity <= 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => updateQuantity(index, item.selectedQuantity - 1)} 
                                disabled={item.isOutOfStock || item.isExpired}
                                className={`w-6 h-6 rounded border border-slate-200 flex items-center justify-center transition-all text-slate-400 ${item.isOutOfStock || item.isExpired ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-orange-700'}`}
                              >
                                <span className="material-symbols-outlined text-xs font-black">remove</span>
                              </button>
                              <input 
                                type="number" 
                                min={1} 
                                value={item.selectedQuantity} 
                                onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 0)} 
                                disabled={item.isOutOfStock || item.isExpired}
                                className={`w-8 text-center font-black text-xs outline-none bg-transparent ${item.isOutOfStock || item.isExpired ? 'text-red-400 cursor-not-allowed' : ''}`} 
                              />
                              <button 
                                onClick={() => updateQuantity(index, item.selectedQuantity + 1)} 
                                disabled={item.isOutOfStock || item.isExpired}
                                className={`w-6 h-6 rounded border border-slate-200 flex items-center justify-center transition-all text-slate-400 ${item.isOutOfStock || item.isExpired ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:text-orange-700'}`}
                              >
                                <span className="material-symbols-outlined text-xs font-black">add</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-500 font-medium">{formatCurrency(item.sellingPrice || 0)}</td>
                          <td className="py-2.5 px-2">
                            <div className={`flex items-center justify-end bg-slate-50 border border-slate-200 rounded px-2 py-0.5 max-w-[80px] ml-auto ${item.isOutOfStock || item.isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <span className="text-[10px] text-slate-400 mr-1">₹</span>
                              <input 
                                type="number" 
                                min={0} 
                                value={item.discount === 0 ? '' : item.discount} 
                                onChange={(e) => updateDiscount(index, Number.parseFloat(e.target.value) || 0)} 
                                disabled={item.isOutOfStock || item.isExpired}
                                className="w-full text-right font-bold text-xs outline-none bg-transparent" 
                                placeholder="0" 
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-slate-900">{formatCurrency(((item.sellingPrice || 0) * item.selectedQuantity) - item.discount)}</td>
                          <td className="py-2.5 px-2 text-center">
                            <button onClick={() => { const newCart = [...cart]; newCart.splice(index, 1); setCart(newCart); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">delete</span></button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-md flex flex-col h-full overflow-hidden shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Summary Checkout</h2>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Total Discount</span><span className="text-green-600">-{formatCurrency(totalDiscount)}</span></div>
                  <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-end"><span className="text-[10px] font-black text-slate-900 uppercase">Grand Total</span><span className="text-2xl font-black text-orange-700 tracking-tight">{formatCurrency(totalAmount)}</span></div>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-4 scrollbar-thin">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-2 tracking-wider">Payment Mode</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['CASH', 'UPI', 'CARD'] as const).map(mode => (
                        <button key={mode} onClick={() => setPaymentMode(mode)} className={`py-2 rounded-lg border font-black text-[10px] uppercase transition-all ${paymentMode === mode ? 'bg-orange-700 border-orange-700 text-white shadow' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>{mode}</button>
                    ))}
                  </div>
                </div>

                {paymentMode !== 'CASH' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Transaction Reference ID</label>
                      <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Ref Number #" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none" />
                    </div>
                )}

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Cash Received Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                    <input type="number" value={amountPaid === 0 ? '' : amountPaid} onChange={(e) => setAmountPaid(Math.max(0, Number.parseFloat(e.target.value) || 0))} className="w-full pl-7 pr-3 py-2 bg-orange-50/50 border-2 border-orange-100 rounded-xl text-lg font-black text-orange-700 outline-none" />
                  </div>
                </div>

                {amountPaid > totalAmount && (
                    <div className="bg-orange-50 p-3 rounded-xl flex justify-between items-center border border-orange-100 shadow-sm animate-pulse">
                      <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Return Balance</span>
                      <span className="text-xl font-black text-orange-600">{formatCurrency(amountPaid - totalAmount)}</span>
                    </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 shrink-0">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || cart.length === 0 || amountPaid < totalAmount || cart.some(item => item.selectedQuantity <= 0 || item.quantity <= 0)}
                    className={`w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isSubmitting || cart.length === 0 ? 'bg-slate-200 cursor-not-allowed' : 'bg-orange-700 hover:bg-orange-800 shadow'}`}
                >
                  {isSubmitting ? (<><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Processing...</span></>) : (<><span className="material-symbols-outlined text-sm font-black">receipt_long</span><span>Confirm & Print Bill</span></>)}
                </button>
              </div>
            </div>
          </div>
        </PageSurface>
      </MainLayout>
  );
}
