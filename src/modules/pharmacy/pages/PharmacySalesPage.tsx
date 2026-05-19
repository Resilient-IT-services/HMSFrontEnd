'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { addToCart, removeFromCart, updateCartQuantity, clearCart } from '@/state/pharmacySlice';
import { PatientResponse, MedicineResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { patientService } from '@/services/patientService';
import { useSearchParams } from 'next/navigation';

export const PharmacySalesPage = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const cart = useSelector((state: RootState) => state.pharmacy.cart);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientSearchState] = useState<PatientResponse[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);

  // Pre-load from URL if provided
  const patientIdParam = searchParams.get('patientId');
  const visitIdParam = searchParams.get('visitId');

  React.useEffect(() => {
    if (patientIdParam) {
      void patientService.get(patientIdParam).then(res => {
        if (res.success && res.data) setSelectedPatient(res.data);
      });
    }
  }, [patientIdParam]);

  const handlePatientSearch = async (val: string) => {
    setPatientSearch(val);
    if (val.length < 3) {
      setPatientSearchState([]);
      return;
    }
    setSearchingPatient(true);
    try {
      const res = await patientService.list(0, 5, val);
      if (res.success && res.data) setPatientSearchState(res.data.content);
    } finally {
      setSearchingPatient(false);
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.sellingPrice || 0) * Number(item.quantity || 0)), 0);
  const tax = subtotal * 0.12;
  const grandTotal = subtotal + tax;

  const resolvePrice = async (medicineId: string, medicineName: string) => {
    let price = 0;
    try {
      const medRes = await pharmacyApi.getMedicineById(medicineId);
      if (medRes.success && medRes.data) {
        price = medRes.data.sellingPrice || medRes.data.purchasePrice || 0;
      }
      
      if (price === 0) {
        const stockRes = await pharmacyApi.getMedicineStock({ search: medicineName });
        if (stockRes.success && stockRes.data?.content) {
          const matchedStock = stockRes.data.content.find(s => s.medicineId === medicineId);
          if (matchedStock) price = matchedStock.sellingPrice || matchedStock.price || matchedStock.purchasePrice || 0;
        }
      }
    } catch (error) {
      console.error('Price resolution failed', error);
    }
    return price;
  };

  const handleAddToCart = async (medicine: any) => {
    console.log('Medicine selected for POS:', medicine);
    
    // Robust stock field resolution
    const stockAvailable = 
      medicine.currentStock === undefined ? medicine.quantity === undefined ? medicine.totalQuantity === undefined ? medicine.stock === undefined ? 0 : medicine.stock :
      medicine.totalQuantity :
      medicine.quantity :
      medicine.currentStock;
    
    const existingInCart = cart.find(i => i.id === medicine.id);
    const currentQtyInCart = existingInCart ? existingInCart.quantity : 0;
    
    if (stockAvailable > 0 && stockAvailable <= currentQtyInCart) {
      triggerGlobalToast(`Only ${stockAvailable} units available in stock`, 'error');
      return;
    }

    if (stockAvailable === 0) {
      triggerGlobalToast(`Warning: System shows 0 stock for ${medicine.name}. Proceeding anyway.`, 'warning');
    }

    // Expiry check
    if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
      triggerGlobalToast('Cannot sell expired medicine', 'error');
      return;
    }

    // Resolve accurate price
    let price = medicine.sellingPrice || medicine.price || medicine.unitPrice || 0;
    if (price === 0 && medicine.id) {
      price = await resolvePrice(medicine.id, medicine.name);
    }

    // Map fields for consistency in Redux store
    const cartItem = {
      ...medicine,
      currentStock: stockAvailable || 999,
      sellingPrice: price
    };

    dispatch(addToCart(cartItem));
    triggerGlobalToast(`${medicine.name} added to cart`, 'success');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedPatient) {
      triggerGlobalToast('Please select a patient before checkout', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const saleItems = cart.map(item => ({
        medicineId: item.id,
        quantity: item.quantity
      }));

      const response = await pharmacyApi.createSale({ 
        patientId: selectedPatient.id,
        visitId: visitIdParam || undefined,
        items: saleItems 
      });
      
      if (response.success) {
        triggerGlobalToast('Sale completed and bill generated', 'success');
        dispatch(clearCart());
        setSelectedPatient(null);
        setPatientSearch('');
      }
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to complete sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Walk-in Billing (POS)">
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
        {/* Left Side: Product Search */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-700">
                <span className="material-symbols-outlined">search_insights</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Quick Inventory Search</h2>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Find and add medicines for walk-in customers</p>
              </div>
            </div>
            <MedicineAutocomplete 
              onSelect={handleAddToCart}
              stockOnly={true}
              placeholder="Start typing medicine name or composition..."
              className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex gap-4">
              <span className="material-symbols-outlined text-orange-600">inventory</span>
              <div>
                <p className="text-xs font-black uppercase text-orange-700 tracking-widest">Live Inventory</p>
                <p className="text-xs text-orange-800/80 mt-1 font-medium leading-relaxed">Direct stock reduction on checkout. Quantities are validated batch-wise.</p>
              </div>
            </div>
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4">
              <span className="material-symbols-outlined text-blue-600">verified</span>
              <div>
                <p className="text-xs font-black uppercase text-blue-700 tracking-widest">FEFO Priority</p>
                <p className="text-xs text-blue-800/80 mt-1 font-medium leading-relaxed">System automatically picks batches with the nearest expiry date first.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Cart & Summary */}
        <div className="w-full lg:w-[480px] flex flex-col h-full gap-6">
          {/* Patient Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-orange-600">person_search</span>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Patient Information</h2>
            </div>
            
            {selectedPatient ? (
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{selectedPatient.fullName}</p>
                  <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">ID: {selectedPatient.patientCode || selectedPatient.id.substring(0,8)}</p>
                </div>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search by name or code..."
                  value={patientSearch}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                  {searchingPatient ? 'sync' : 'search'}
                </span>
                
                {patientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {patientResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchState([]);
                          setPatientSearch('');
                        }}
                        className="w-full p-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-none"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{p.fullName}</p>
                          <p className="text-[10px] font-medium text-slate-500 uppercase">{p.patientCode || 'No Code'}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col h-full overflow-hidden min-h-0">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined text-slate-700 text-2xl">receipt_long</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-[8px] font-black text-white rounded-full flex items-center justify-center animate-pulse">
                      {cart.length}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Bill</h2>
              </div>
              <button 
                onClick={() => dispatch(clearCart())}
                className="px-3 py-1.5 bg-red-50 text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white rounded-lg uppercase tracking-tighter transition-all"
              >
                Clear Cart
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] bg-slate-50/30">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-40">
                  <span className="material-symbols-outlined text-7xl">point_of_sale</span>
                  <div className="text-center">
                    <p className="text-base font-black uppercase tracking-widest">Ready for Sale</p>
                    <p className="text-xs font-medium">Add medicines to start billing</p>
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white group transition-all hover:shadow-xl hover:border-orange-200 active:scale-[0.99]">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase tracking-tighter border border-slate-200">
                          {item.batchNumber}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Exp: {item.expiryDate}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <button 
                          onClick={() => dispatch(updateCartQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-all text-slate-600"
                        >
                          <span className="material-symbols-outlined text-base">remove</span>
                        </button>
                        <span className="text-base font-black text-slate-800 w-10 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            if (item.quantity < (item.currentStock || 0)) {
                              dispatch(updateCartQuantity({ id: item.id, quantity: item.quantity + 1 }));
                            } else {
                              triggerGlobalToast('Maximum available stock reached', 'warning');
                            }
                          }}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-all text-slate-600"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end py-1">
                      <button 
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-bold">₹{(item.sellingPrice || 0).toFixed(2)}</p>
                        <p className="text-lg font-black text-slate-900 leading-none">₹{((item.sellingPrice || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-white space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest italic">
                  <span>GST (12%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Total Payable</span>
                  <span className="text-3xl font-black text-orange-700 leading-none">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full py-5 bg-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-700/30 hover:bg-orange-800 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined">payments</span>
                  )}
                  {loading ? 'Processing...' : 'Complete & Generate Bill'}
                </button>
                
                <button 
                  onClick={() => globalThis.print()}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">print</span> Print Estimate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PharmacySalesPage;
