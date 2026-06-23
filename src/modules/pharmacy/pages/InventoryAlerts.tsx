'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { PharmacyStockDTO } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';

import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

export const InventoryAlerts = () => {
  const [lowStock, setLowStock] = useState<PharmacyStockDTO[]>([]);
  const [expiring, setExpiring] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const [lowRes, expRes] = await Promise.all([
          pharmacyApi.getLowStockAlerts({ threshold: 20 }),
          pharmacyApi.getExpiryAlerts(30)
        ]);

        if (lowRes.success && lowRes.data) {
          setLowStock(lowRes.data.content || []);
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
    <MainLayout title="Inventory Alerts" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Inventory Alerts"
            description="Proactive monitoring of low stock and nearing expiration pharmaceutical items."
          />
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
                  <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Medicine</th>
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">In Stock</th>
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lowStock.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <p className="font-bold text-slate-800 text-sm">{item.medicineName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Batch: {item.batchNumber}</p>
                          </div></td>
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <span className={`text-sm font-black ${item.quantity === 0 ? 'text-red-600' : 'text-orange-600'}`}>{item.quantity} Units</span>
                          </div></td>
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <button className="text-[10px] font-black text-orange-700 uppercase tracking-widest hover:underline">Restock</button>
                          </div></td>
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
                  <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Medicine</th>
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Expiry</th>
                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expiring.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <p className="font-bold text-slate-800 text-sm">{item.medicineName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Batch: {item.batchNumber}</p>
                          </div></td>
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <span className="text-sm font-black text-red-600">{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div></td>
                          <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                            <button className="text-[10px] font-black text-red-700 uppercase tracking-widest hover:underline">Remove</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
