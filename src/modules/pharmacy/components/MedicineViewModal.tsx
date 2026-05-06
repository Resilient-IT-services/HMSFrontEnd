'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from './LoadingSkeleton';

interface MedicineViewModalProps {
  medicineId: string;
  onClose: () => void;
}

const MedicineViewModal: React.FC<MedicineViewModalProps> = ({ medicineId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<MedicineResponse | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await pharmacyApi.getMedicineById(medicineId);
        if (response.success && response.data) {
          setMedicine(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [medicineId]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Medicine Information" maxWidth="max-w-5xl">
      <div className="overflow-hidden">
        {/* Header - Matching BatchEntry Style */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 -mx-6 -mt-6 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Medicine Profile</h2>
            <p className="text-sm text-slate-500 font-medium">Complete pharmacological and inventory details.</p>
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
             <span className="material-symbols-outlined text-slate-900 text-3xl">analytics</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSkeleton /></div>
        ) : medicine ? (
          <div className="space-y-10">
            {/* Top Identity Section */}
            <div className="flex flex-wrap gap-8 items-end justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg tracking-[0.1em]">
                            {medicine.form || medicine.category || 'General'}
                         </span>
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Product SKU: {medicine.id.split('-')[0]}</p>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{medicine.name}</h3>
                    <p className="text-lg font-bold text-slate-500 italic opacity-80">Composition: {medicine.composition || 'Not listed in master record'}</p>
                </div>
                <div className="bg-white border-2 border-slate-900 p-6 rounded-[2rem] min-w-[200px] text-right shadow-[10px_10px_0px_0px_rgba(15,23,42,0.05)]">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total On-Hand</p>
                    <p className="text-4xl font-black text-slate-900 leading-none">{medicine.currentStock || 0} <span className="text-sm opacity-30">PCS</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left & Middle Column - Specs */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Pharmacological Specs
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Generic / Salt Name</p>
                        <p className="text-sm font-black text-slate-700">{medicine.genericName || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Manufacturer / Brand</p>
                        <p className="text-sm font-black text-slate-700">{medicine.manufacturer || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Strength</p>
                            <p className="text-sm font-black text-slate-700">{medicine.strength || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                            <p className="text-xs font-black text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 inline-block">
                                {medicine.scheduledType || medicine.scheduleDrug || 'UNSCHEDULED'}
                            </p>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Storage & Logistics
                  </h4>
                  <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100 space-y-4">
                      <div className="flex items-center gap-3 text-blue-800">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-200/50">
                            <span className="material-symbols-outlined text-[22px]">thermostat</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Temp Requirement</p>
                            <p className="text-sm font-black uppercase tracking-tight">{medicine.temperature || 'Room Temperature'}</p>
                          </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-2 ml-1">Administration Notes</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/60 p-3 rounded-xl border border-blue-100/50 italic">
                            "{medicine.specialNotes || 'Standard handling procedures apply. Keep away from direct sunlight and moisture. Store in a cool, dry place.'}"
                        </p>
                      </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Financial & Stock Controls */}
              <div className="space-y-6">
                 <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Commercial Analytics
                 </h4>
                 <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-5 flex justify-between items-center bg-slate-900 text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Unit MRP</p>
                        <p className="text-2xl font-black">₹ {medicine.sellingPrice?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</p>
                    </div>
                    <div className="p-5 divide-y divide-slate-100">
                        <div className="py-4 flex justify-between items-center">
                            <p className="text-[11px] font-bold text-slate-400 uppercase">Purchase Rate</p>
                            <p className="text-lg font-black text-slate-700">₹ {medicine.purchasePrice?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</p>
                        </div>
                        <div className="py-4 flex justify-between items-center">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase">Est. Gross Margin</p>
                                <p className="text-[9px] font-black text-green-500 uppercase mt-1">Per Unit Profit</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-green-600">
                                    {medicine.purchasePrice && medicine.sellingPrice 
                                      ? (((medicine.sellingPrice - medicine.purchasePrice) / medicine.purchasePrice) * 100).toFixed(1) + '%' 
                                      : '0.0%'}
                                </p>
                            </div>
                        </div>
                        <div className="py-4 flex justify-between items-center">
                            <p className="text-[11px] font-bold text-slate-400 uppercase">Threshold Level</p>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase">{medicine.reorderLevel || 50} Units</span>
                        </div>
                    </div>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Net Inventory Valuation</p>
                    <div className="text-center space-y-1">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                            ₹ {( (medicine.currentStock || 0) * (medicine.purchasePrice || 0) ).toLocaleString(undefined, {minimumFractionDigits: 0})}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Based on last purchase rate</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
              >
                CLOSE PRODUCT PROFILE
              </button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
             <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">inventory_2</span>
             <p className="text-slate-400 font-bold">Medicine profile not found.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MedicineViewModal;
