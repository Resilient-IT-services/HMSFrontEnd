'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { addToCart, removeFromCart, updateCartQuantity, clearCart } from '@/state/pharmacySlice';
import { MedicineResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';

export default function SalesPage() {
  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.pharmacy.cart);
  const [loading, setLoading] = useState(false);

  const total = cart.reduce((acc, item) => acc + (item.sellingPrice || 0) * item.quantity, 0);

  const handleAddToCart = (medicine: MedicineResponse) => {
    // Basic stock check
    if ((medicine.currentStock || 0) <= 0) {
      triggerGlobalToast('Medicine out of stock', 'error');
      return;
    }

    // Expiry check
    if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
      triggerGlobalToast('Cannot sell expired medicine', 'error');
      return;
    }

    dispatch(addToCart(medicine));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const saleItems = cart.map(item => ({
        medicineId: item.id,
        batchNumber: item.batchNumber, // Ensure batch-wise selling
        quantity: item.quantity,
        price: item.sellingPrice
      }));

      const response = await pharmacyApi.createSale({ items: saleItems });
      
      if (response.success) {
        triggerGlobalToast('Sale completed successfully (Stock updated)', 'success');
        dispatch(clearCart());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Pharmacy POS">
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)]">
        {/* Left Side: Product Search */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Search Medicines</h2>
            <MedicineAutocomplete 
              onSelect={handleAddToCart}
              stockOnly={true}
              placeholder="Search in-stock medicines..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-[10px] font-black uppercase text-orange-700 tracking-widest">Stock Alert</p>
              <p className="text-xs text-orange-900 mt-1 font-medium">Quantities are fetched batch-wise. Expired batches are automatically hidden.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black uppercase text-blue-700 tracking-widest">FEFO Applied</p>
              <p className="text-xs text-blue-900 mt-1 font-medium">System prioritizes medicines with the nearest expiry date first.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Cart & Summary */}
        <div className="w-full lg:w-[450px] flex flex-col h-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-700">shopping_cart</span>
                <h2 className="text-lg font-bold text-slate-800">Billing Cart</h2>
              </div>
              <button 
                onClick={() => dispatch(clearCart())}
                className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
              >
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
                  <span className="material-symbols-outlined text-5xl">inventory_2</span>
                  <p className="text-sm font-bold">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30 group transition-all hover:bg-white hover:shadow-md hover:border-orange-200">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.batchNumber} • Exp: {item.expiryDate}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button 
                          onClick={() => dispatch(updateCartQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:border-orange-500 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-sm font-black text-slate-800 w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            if (item.quantity < (item.currentStock || 0)) {
                              dispatch(updateCartQuantity({ id: item.id, quantity: item.quantity + 1 }));
                            } else {
                              triggerGlobalToast('Maximum available stock reached', 'warning');
                            }
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-white hover:border-orange-500 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      <button 
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                      <div>
                        <p className="text-xs text-slate-400 font-bold mb-1">${(item.sellingPrice || 0).toFixed(2)}</p>
                        <p className="text-sm font-black text-slate-900">${((item.sellingPrice || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Tax (Estimated)</span>
                  <span>$0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <span className="text-lg font-black text-slate-800">Total Amount</span>
                  <span className="text-2xl font-black text-orange-700">${total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="w-full py-4 bg-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? 'Processing Transaction...' : 'Generate Bill & Complete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
