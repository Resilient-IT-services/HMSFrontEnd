'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';

export const InventoryAlerts = () => {
  const [lowStock, setLowStock] = useState<MedicineResponse[]>([]);
  const [expiring, setExpiring] = useState<MedicineResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const [lowRes, expRes] = await Promise.all([
          pharmacyApi.getLowStockAlerts(20),
          pharmacyApi.getExpiryAlerts(30)
        ]);

        if (lowRes.success && lowRes.data) {
          setLowStock(lowRes.data);
        }
        
        if (expRes.success && expRes.data) {
          setExpiring(expRes.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <MainLayout title="Inventory Alerts">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Low Stock Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">warning</span>
                <h2 className="text-xl font-bold text-slate-800">Low Stock Alert</h2>
              </div>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{lowStock.length} Items</span>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? <div className="p-8"><LoadingSkeleton /></div> : lowStock.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">No low stock items detected.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Medicine</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">In Stock</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lowStock.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-black ${item.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>{item.currentStock} Units</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[10px] font-black text-orange-700 uppercase tracking-widest hover:underline">Restock</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Expiry Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">event_busy</span>
                <h2 className="text-xl font-bold text-slate-800">Expiring Soon</h2>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{expiring.length} Items</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? <div className="p-8"><LoadingSkeleton /></div> : expiring.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">No items expiring soon.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Medicine</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Expiry</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expiring.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Batch: {item.batchNumber}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-red-600">{item.expiryDate}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[10px] font-black text-red-700 uppercase tracking-widest hover:underline">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
