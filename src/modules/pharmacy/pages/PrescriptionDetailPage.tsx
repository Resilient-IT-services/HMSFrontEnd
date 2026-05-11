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

interface PrescriptionDetailPageProps {
  id: string;
}

export const PrescriptionDetailPage: React.FC<PrescriptionDetailPageProps> = ({ id }) => {
  const router = useRouter();
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [billItems, setBillItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const response = await pharmacyApi.getPrescriptionById(id);
        if (response.success && response.data) {
          setPrescription(response.data);
          // Pre-populate bill items based on prescription if medicines are mapped
          const initialItems = response.data.items.map(item => ({
            id: item.medicineId || Math.random().toString(),
            name: item.medicineName,
            dosage: item.dosage,
            duration: item.duration,
            quantity: 1, // Default quantity
            price: 0,
          }));
          setBillItems(initialItems);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

  const handleAddMedicine = (medicine: MedicineResponse) => {
    setBillItems(prev => [...prev, {
      id: medicine.id,
      name: medicine.name,
      dosage: '-',
      duration: '-',
      quantity: 1,
      price: medicine.sellingPrice || 0,
      isManual: true
    }]);
  };

  const handleDispense = async () => {
    setDispensing(true);
    try {
      const response = await pharmacyApi.markAsDispensed(id);
      if (response.success) {
        triggerGlobalToast('Prescription dispensed and billed', 'success');
        router.push('/pharmacy/dashboard');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDispensing(false);
    }
  };

  if (loading) return <MainLayout title="Loading..."><LoadingSkeleton /></MainLayout>;
  if (!prescription) return <MainLayout title="Not Found"><div>Prescription not found</div></MainLayout>;

  return (
    <MainLayout title={`Process Prescription: #RX-${id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Patient & Doctor Info */}
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
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined">stethoscope</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Doctor</p>
                <p className="text-lg font-bold text-slate-900">{prescription.doctorName}</p>
              </div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={prescription.status || 'PENDING'} />
            </div>
          </section>

          {/* Prescribed Medicines */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Doctor's Prescription</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{prescription.items.length} Items</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Medicine</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Dosage</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prescription.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.medicineName}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">{item.dosage}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 font-medium">{item.duration}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Billing Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Dispensing & Billing</h2>
              <div className="w-64">
                <MedicineAutocomplete onSelect={handleAddMedicine} placeholder="Add more items..." />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {billItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.dosage} • {item.duration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => {
                          const newItems = [...billItems];
                          newItems[idx].quantity = Number(e.target.value);
                          setBillItems(newItems);
                        }}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-sm text-center font-bold"
                      />
                      <span className="text-xs text-slate-400 uppercase font-black">Qty</span>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-black text-slate-800">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Items Subtotal</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Tax (12%)</span>
                <span>$0.00</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                <span className="text-sm font-black text-slate-800 uppercase">Grand Total</span>
                <span className="text-3xl font-black text-orange-700">$0.00</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={handleDispense}
                disabled={dispensing}
                className="w-full py-4 bg-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50"
              >
                {dispensing ? 'Processing...' : 'Complete & Dispense'}
              </button>
              <button className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                Print Invoice
              </button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrescriptionDetailPage;
