'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { PageHeading } from '@/components/ui/PageHeading';

interface CartItem extends PharmacyStockDTO {
  selectedQuantity: number;
  discount: number;
}

export default function QuickPharmacyBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const initialized = useRef(false);
  
  // Sale Header State
  const [saleType, setSaleType] = useState<'WALKIN' | 'VISIT'>('WALKIN');
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffResponse | null>(null);
  const [externalDoctorName, setExternalDoctorName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [prescribedDoctorId, setPrescribedDoctorId] = useState<string | null>(null);
  const [visitId, setVisitId] = useState<string | null>(null);
  
  // Cart State - Key is stockId (batch ID) to allow multiple rows per medicine
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Payment State
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Totals Calculation
  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice! * item.selectedQuantity), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  const totalAmount = subtotal - totalDiscount;

  useEffect(() => {
    if (!isSubmitting && amountPaid !== totalAmount) {
      setAmountPaid(totalAmount);
    }
  }, [totalAmount, isSubmitting]);

  // Handle URL Params for Pre-loading
  useEffect(() => {
    if (initialized.current) return;
    
    const rxId = searchParams.get('prescriptionId');
    const pid = searchParams.get('patientId');
    
    if (rxId || pid) {
      initialized.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaleType('VISIT');
      
      const loadData = async () => {
        try {
          if (rxId) {
            setPrescriptionId(rxId);
            const res = await pharmacyApi.getPrescriptionById(rxId);
            if (res.success && res.data) {
              const rx = res.data;
              
              // Parallelize patient lookup and doctor handling
              const patientPromise = rx.patientId ? pharmacyApi.getPatientById(rx.patientId) : Promise.resolve(null);
              
              setExternalDoctorName(rx.doctorName || '');
              if (rx.doctorId) setPrescribedDoctorId(rx.doctorId);
              
              // CRITICAL FIX: Only use visitId if it exists, don't use appointmentId as visitId
              if (rx.visitId) {
                setVisitId(rx.visitId);
              } else {
                setVisitId(null);
              }

              const pRes = await patientPromise;
              if (pRes?.success && pRes.data) setSelectedPatient(pRes.data);

              // FIFO Multi-batch loading logic
              const newItems: CartItem[] = [];
              
              // For each prescribed item, find batches and apply FIFO
              for (const rxItem of rx.items) {
                // Find all available batches for this medicine, ordered by expiry (FIFO)
                const stockRes = await pharmacyApi.getMedicineStock({ 
                  search: rxItem.medicineName, 
                  size: 5 // Get up to 5 batches to fulfill quantity
                });

                if (stockRes.success && stockRes.data?.content?.length) {
                  // Assuming prescription doesn't have an explicit quantity yet (dosage/duration based)
                  // For now we fulfill with 1 unit or try to match if prescription data had it.
                  // If we don't have a numeric quantity in rxItem, we default to 1 unit from the oldest batch.
                  const prescribedQty = 1; // Placeholder: in real scenario, parse dosage/duration
                  
                  let remainingToFulfill = prescribedQty;
                  const availableBatches = stockRes.data.content;
                  
                  for (const batch of availableBatches) {
                    if (remainingToFulfill <= 0) break;
                    
                    const takeFromThisBatch = Math.min(remainingToFulfill, batch.quantity);
                    if (takeFromThisBatch > 0) {
                      newItems.push({ 
                        ...batch, 
                        selectedQuantity: takeFromThisBatch, 
                        discount: 0 
                      });
                      remainingToFulfill -= takeFromThisBatch;
                    }
                  }
                  
                  if (remainingToFulfill > 0) {
                    triggerGlobalToast(`Partially fulfilled ${rxItem.medicineName}. Missing ${remainingToFulfill} units.`, 'warning');
                  }
                } else {
                  triggerGlobalToast(`No stock found for ${rxItem.medicineName}`, 'warning');
                }
              }
              
              setCart(prev => [...prev, ...newItems]);
            }
          } else if (pid) {
            const pRes = await pharmacyApi.getPatientById(pid);
            if (pRes.success && pRes.data) setSelectedPatient(pRes.data);
          }
        } catch (error) {
          console.error('Failed to load pre-filled data', error);
          triggerGlobalToast('Failed to load details', 'error');
        }
      };
      loadData();
    }
  }, [searchParams]);

  const addToCart = (stock: PharmacyStockDTO) => {
    // Check if this EXACT batch is already in cart
    const existingIndex = cart.findIndex(item => item.id === stock.id);
    
    if (existingIndex === -1) {
      // Add as a new row (supports multi-batch for same medicine)
      setCart([...cart, { ...stock, selectedQuantity: 1, discount: 0 }]);
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

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index: number, qty: number) => {
    const newCart = [...cart];
    const stockQty = newCart[index].quantity;
    if (qty > stockQty) {
      triggerGlobalToast(`Only ${stockQty} units available in this batch`, 'warning');
      newCart[index].selectedQuantity = stockQty;
    } else if (qty < 1) {
      newCart[index].selectedQuantity = 1;
    } else {
      newCart[index].selectedQuantity = qty;
    }
    setCart(newCart);
  };

  const updateDiscount = (index: number, discount: number) => {
    const newCart = [...cart];

    const item = newCart[index];
    const itemTotal = item.sellingPrice! * item.selectedQuantity;

    const safeDiscount = Math.max(0, discount);

    if (safeDiscount > itemTotal) {
      triggerGlobalToast(
          `Discount cannot exceed total amount (${formatCurrency(itemTotal)})`,
          'error'
      );

      return;
    }

    newCart[index].discount = safeDiscount;
    setCart(newCart);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const invalidItem = cart.find(
        item =>
            item.selectedQuantity <= 0 ||
            item.quantity <= 0
    );

    if (invalidItem) {
      triggerGlobalToast(
          'Items with 0 quantity or 0 stock cannot be billed',
          'error'
      );
      return;
    }

    if (cart.length === 0) {
      triggerGlobalToast('Cart is empty', 'error');
      return;
    }

    if (saleType === 'WALKIN' && !customerName) {
      triggerGlobalToast(
          'Customer name is required for walk-in',
          'error'
      );
      return;
    }

    if (
        saleType === 'WALKIN' &&
        (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone))
    ) {
      triggerGlobalToast(
          'Please enter a valid 10-digit mobile number',
          'error'
      );
      return;
    }
    if (saleType === 'VISIT' && !selectedPatient) {
      triggerGlobalToast(
          'Patient selection is required for patient visit billing',
          'error'
      );
      return;
    }
    if (
        saleType === 'VISIT' && !selectedDoctor) {
      triggerGlobalToast(
          'Doctor selection is required for patient visit billing',
          'error'
      );
      return;
    }
    if (amountPaid < totalAmount) {
      triggerGlobalToast(
          'Paid amount cannot be less than total amount',
          'error'
      );
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
        items: cart.map(item => ({
          medicineBatchId: item.id,
          quantity: item.selectedQuantity,
          discountAmount: item.discount,
          taxAmount: 0
          })),
        payment: {
          mode: paymentMode as any,
          amount: amountPaid,
          referenceNumber
        },
        notes: ''
      };

      const response = await pharmacyApi.createQuickSale(payload);
      
      if (response.success && response.data) {
        triggerGlobalToast('Sale completed successfully', 'success');
        // Redirect to detail page
        router.push(`/pharmacy/sales/${response.data.saleId}`);
      } else {
        triggerGlobalToast(response.message || 'Failed to create sale', 'error');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Sale error:', error);
      triggerGlobalToast(error.response?.data?.message || error.message || 'An error occurred', 'error');
      setIsSubmitting(false); // Re-enable on exception
    }
  };

  return (
    <MainLayout title="Pharmacy Billing" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <div className="flex flex-col h-[calc(100vh-180px)] overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight">Quick Walk-in Pharmacy Billing</h1>
                {prescriptionId && (
                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1">
                    Processing Prescription: #RX-{prescriptionId}
                  </span>
                )}
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                {PHARMACY_SALE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSaleType(option.value)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${saleType === option.value ? 'bg-white shadow-xl text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6 flex-1 overflow-hidden">
              {/* Left & Center: Info + Search */}
              <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Top Section: Customer/Patient Info */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {saleType === 'VISIT' ? (
                      <div className="col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Patient Lookup</label>
                        <PatientSearch onSelect={setSelectedPatient} defaultValue={selectedPatient?.fullName} />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Customer Name</label>
                          <input 
                            type="text" 
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter customer name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Phone Number</label>
                          <input
                              type="tel"
                              maxLength={10}
                              value={customerPhone}
                              onChange={(e) =>
                                  setCustomerPhone(e.target.value.replaceAll(/\D/g, ''))
                              }
                              placeholder="Enter 10-digit mobile number"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Doctor (Hospital)</label>
                      <DoctorSearch onSelect={setSelectedDoctor} defaultValue={selectedDoctor?.fullName} />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">External Doctor Name</label>
                      <input 
                        type="text" 
                        value={externalDoctorName}
                        onChange={(e) => setExternalDoctorName(e.target.value)}
                        placeholder="e.g. Dr. Sharma"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Center Section: Medicine Search */}
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm flex flex-col overflow-hidden">
                  <label className="block text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Medicine Selection</label>
                  <div className="mb-6">
                    <MedicineStockSearch onSelect={addToCart} />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="pb-4 px-4">Medicine / Batch</th>
                          <th className="pb-4 px-4 text-center">Stock</th>
                          <th className="pb-4 px-4 text-center">Qty</th>
                          <th className="pb-4 px-4 text-right">Price</th>
                          <th className="pb-4 px-4 text-right">Disc.</th>
                          <th className="pb-4 px-4 text-right">Total</th>
                          <th className="pb-4 px-4 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {cart.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-20 text-center">
                              <div className="flex flex-col items-center opacity-20">
                                <span className="material-symbols-outlined text-[80px]">shopping_cart</span>
                                <p className="text-sm font-black uppercase mt-4 tracking-widest">No items added to cart</p>
                              </div>
                            </td>
                          </tr>
                        ) : cart.map((item, index) => (
                          <tr key={`${item.id}-${index}`} className="group bg-slate-50/50 hover:bg-primary/5 transition-all">
                            <td className="py-4 px-4 first:rounded-l-2xl">
                              <p className="font-black text-sm text-slate-800">{item.medicineName}</p>
                              <p className="text-[10px] font-mono text-primary font-black uppercase mt-0.5">#{item.batchNumber}</p>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${item.quantity < 10 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-3">
                                <button 
                                  onClick={() => updateQuantity(index, item.selectedQuantity - 1)}
                                  className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-lg active:scale-90 transition-all text-slate-400 hover:text-primary"
                                ><span className="material-symbols-outlined text-sm font-black">remove</span></button>
                                <input 
                                  type="number" min={1}
                                  value={item.selectedQuantity}
                                  onChange={(e) => updateQuantity(index, Number.parseInt(e.target.value) || 0)}
                                  className="w-10 text-center font-black text-sm outline-none bg-transparent"
                                />
                                <button 
                                  onClick={() => updateQuantity(index, item.selectedQuantity + 1)}
                                  className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-lg active:scale-90 transition-all text-slate-400 hover:text-primary"
                                ><span className="material-symbols-outlined text-sm font-black">add</span></button>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-sm text-slate-600">
                              {formatCurrency(item.sellingPrice!)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-black text-slate-300 mr-1.5">₹</span>
                                <input 
                                  type="number" min={0}
                                  value={item.discount}
                                  onChange={(e) => updateDiscount(index, Number.parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right font-black text-sm outline-none bg-transparent"
                                  placeholder="0"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-black text-sm text-primary">
                              {formatCurrency((item.sellingPrice! * item.selectedQuantity) - item.discount)}
                            </td>
                            <td className="py-4 px-4 text-center last:rounded-r-2xl">
                              <button 
                                onClick={() => removeFromCart(index)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Panel: Summary & Payment */}
              <div className="w-[400px] bg-white rounded-[40px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Payment Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-500">Total Discount</span>
                      <span className="text-green-600">-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-end">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
                      <span className="text-4xl font-black text-primary leading-none tracking-tight">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Select Payment Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['CASH', 'UPI', 'CARD'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setPaymentMode(mode)}
                          className={`py-4 rounded-[20px] border-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${paymentMode === mode ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-primary/20 hover:text-primary'}`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMode !== 'CASH' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Transaction Reference</label>
                      <input 
                        type="text" 
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Enter Reference #"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold focus:ring-4 focus:ring-primary/10 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Cash Received</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40">₹</span>
                      <input 
                        type="number" 
                        value={amountPaid}
                        onChange={(e) =>
                            setAmountPaid(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                        className="w-full pl-10 pr-4 py-4 bg-primary/5 border-2 border-primary/10 rounded-[24px] text-2xl font-black text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {amountPaid > totalAmount && (
                    <div className="bg-orange-50 p-4 rounded-[24px] flex justify-between items-center border border-orange-100 shadow-sm animate-in pulse duration-1000 infinite">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Change to Return</span>
                      <span className="text-2xl font-black text-orange-600">{formatCurrency(amountPaid - totalAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="p-8 pt-0">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || cart.length === 0 || amountPaid < totalAmount || cart.some(item => item.selectedQuantity <= 0 || item.quantity <= 0)}
                    className={`w-full py-5 rounded-[24px] text-white font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl ${isSubmitting || cart.length === 0 ? 'bg-slate-200 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:scale-[1.02] shadow-primary/20 active:scale-95'}`}>
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined font-black">receipt_long</span>
                        <span>Confirm & Print</span>
                      </div>
                    )}
                  </button>
                  <div className="mt-6 flex justify-center gap-4">
                    <div className="flex items-center gap-1.5 opacity-30">
                        <kbd className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black border border-slate-200">F2</kbd>
                        <span className="text-[9px] font-black uppercase">Save</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-30">
                        <kbd className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black border border-slate-200">F4</kbd>
                        <span className="text-[9px] font-black uppercase">Reset</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
}
