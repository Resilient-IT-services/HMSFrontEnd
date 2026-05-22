'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { MedicineResponse, PharmacyStockDTO } from '@/types/api';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';

import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

interface BatchDetailPageProps {
  id: string;
}

export const BatchDetailPage: React.FC<BatchDetailPageProps> = ({ id }) => {
  const router = useRouter();
  const [medicine, setMedicine] = useState<MedicineResponse | null>(null);
  const [batches, setBatches] = useState<PharmacyStockDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const [medRes, batchRes] = await Promise.all([
          pharmacyApi.getMedicineById(id),
          pharmacyApi.getMedicineStock() // In a real API, this would take medicineId
        ]);

        if (medRes.success) setMedicine(medRes.data || null);
        if (batchRes.success && batchRes.data) {
          // Filter batches for this medicine if API doesn't support medicineId param
          setBatches(batchRes.data.content.filter(b => b.medicineId === id));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [id]);

  if (loading) return <MainLayout title="Loading..." hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><LoadingSkeleton /></PageSurface></MainLayout>;
  if (!medicine) return <MainLayout title="Error" hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><div>Medicine not found</div></PageSurface></MainLayout>;

  return (
    <MainLayout title={`Batch Inventory: ${medicine.name}`} hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Batch Inventory Details"
            description={`Detailed breakdown of all available batches for ${medicine.name}.`}
          />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Total Aggregated Stock</p>
              <h3 className="text-3xl font-black text-slate-900">{medicine.currentStock} Units</h3>
            </div>
            <button 
              onClick={() => router.push('/pharmacy/batch-entry')}
              className="px-6 py-3 bg-orange-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add New Batch
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Available Qty</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Selling Price</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No batch data available for this medicine.</td>
                  </tr>
                ) : batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md uppercase">
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{batch.expiryDate}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-emerald-600">{batch.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">${batch.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default BatchDetailPage;
