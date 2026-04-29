'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { adminService } from '@/services/adminService';
import { hospitalService } from '@/services/hospitalService';
import { setCurrentHospitalId } from '@/state/authSlice';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { HospitalResponse } from '@/types/api';
import Link from 'next/link';

const VitalsConfigPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const currentHospitalId = user?.currentHospitalId;

  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [settings, setSettings] = useState<Record<string, {minValue: number, maxValue: number, unit: string}>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    minValue: 0,
    maxValue: 0,
    unit: ''
  });

  const VITAL_TYPES = [
    { value: 'BODY_TEMPERATURE', label: 'Body Temperature' },
    { value: 'SYSTOLIC_BP', label: 'Systolic BP' },
    { value: 'DIASTOLIC_BP', label: 'Diastolic BP' },
    { value: 'HEART_RATE', label: 'Heart Rate' },
    { value: 'OXYGEN_LEVEL', label: 'Oxygen Level (SpO2)' },
    { value: 'WEIGHT', label: 'Weight' },
  ];

  const fetchHospitals = async () => {
    try {
      const res = await hospitalService.list(0, 100);
      if (res.success && res.data) {
        setHospitals(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals', error);
    }
  };

  const fetchSettings = async () => {
    if (!currentHospitalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await adminService.getVitalRanges();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch vital settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [currentHospitalId]);

  const handleHospitalChange = (id: string) => {
    dispatch(setCurrentHospitalId(id));
  };

  const handleOpenModal = (type: string, currentRange?: any) => {
    setEditingType(type);
    setFormData({
      minValue: currentRange?.minValue || 0,
      maxValue: currentRange?.maxValue || 0,
      unit: currentRange?.unit || ''
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (formData.minValue >= formData.maxValue) errors.maxValue = 'Max must be greater than min';
    if (!formData.unit) errors.unit = 'Unit is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editingType || !validate()) {
      return;
    }
    try {
      const res = await adminService.updateVitalRange(editingType, {
        minValue: formData.minValue,
        maxValue: formData.maxValue,
        unit: formData.unit
      });
      if (res.success) {
        triggerGlobalToast(`${getVitalLabel(editingType)} updated successfully`, 'success');
        setIsModalOpen(false);
        fetchSettings();
      }
    } catch (error) {
      // Interceptor handles toast
    }
  };

  const getVitalLabel = (value: string) => {
    return VITAL_TYPES.find(t => t.value === value)?.label || value;
  };

  const renderUnitSelection = () => {
    if (editingType === 'BODY_TEMPERATURE') {
      return (
        <select 
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none"
          value={formData.unit}
          onChange={(e) => setFormData({...formData, unit: e.target.value})}
        >
          <option value="">Select Unit...</option>
          <option value="CELSIUS">CELSIUS (°C)</option>
          <option value="FAHRENHEIT">FAHRENHEIT (°F)</option>
        </select>
      );
    }
    if (editingType === 'WEIGHT') {
      return (
        <select 
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none"
          value={formData.unit}
          onChange={(e) => setFormData({...formData, unit: e.target.value})}
        >
          <option value="">Select Unit...</option>
          <option value="KG">KG (Kilograms)</option>
          <option value="LB">LB (Pounds)</option>
        </select>
      );
    }
    return (
      <input 
        type="text" 
        className={`w-full bg-slate-50 border ${fieldErrors.unit ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none`}
        placeholder="e.g. mmHg, bpm, %"
        value={formData.unit}
        onChange={(e) => setFormData({...formData, unit: e.target.value})}
      />
    );
  };

  return (
    <MainLayout title="Vitals Configuration">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Hospital Context Selector */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
              <span className="material-symbols-outlined text-3xl">local_hospital</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Hospital Configuration Context</h2>
              <p className="text-sm text-slate-500 italic">Select a hospital to manage its specific clinical vital thresholds.</p>
            </div>
          </div>
          <div className="w-full md:w-72">
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
              value={currentHospitalId || ''}
              onChange={(e) => handleHospitalChange(e.target.value)}
            >
              <option value="">Select Hospital...</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.hospitalCode})</option>
              ))}
            </select>
          </div>
        </div>

        {!currentHospitalId ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">clinical_notes</span>
            <h3 className="text-xl font-bold text-gray-400 italic">No Hospital Context Selected</h3>
            <p className="text-gray-400 mt-2">Please select a hospital above to view and configure patient safety ranges.</p>
          </div>
        ) : (
          <Card>
            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">health_metrics</span>
                Vital Safety Ranges for {hospitals.find(h => h.id === currentHospitalId)?.name}
              </h3>
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">Dynamic Backend Enforcement</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vital Metric</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Safety Range (Min - Max)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Measurement Unit</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">Loading configuration...</td></tr>
                  ) : VITAL_TYPES.map((type) => {
                    const range = settings[type.value];
                    return (
                      <tr key={type.value} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-700">{type.label}</td>
                        <td className="px-6 py-4">
                          {range ? (
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                              {range.minValue} — {range.maxValue}
                            </span>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Awaiting Initialization...</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {range ? (
                            <span className="text-sm font-bold text-slate-600 tracking-tight">{range.unit}</span>
                          ) : (
                            <span className="text-gray-300">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleOpenModal(type.value, range)} 
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingType ? `Configure ${getVitalLabel(editingType)} Thresholds` : 'Config'}
      >
        <div className="p-6 space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex gap-3">
            <span className="material-symbols-outlined text-orange-600">info</span>
            <p className="text-xs text-orange-800 italic leading-relaxed">
              Updating these values will immediately affect all clinical data entry for this hospital. 
              Values outside this range will be blocked by the backend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Safety Minimum</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm"
                value={formData.minValue}
                onChange={(e) => setFormData({...formData, minValue: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Safety Maximum</label>
              <input 
                type="number" 
                className={`w-full bg-slate-50 border ${fieldErrors.maxValue ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm`}
                value={formData.maxValue}
                onChange={(e) => setFormData({...formData, maxValue: Number(e.target.value)})}
              />
              {fieldErrors.maxValue && <p className="text-red-500 text-[9px] mt-1 font-bold uppercase tracking-tighter animate-bounce">{fieldErrors.maxValue}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary Measurement Unit</label>
              {renderUnitSelection()}
              {fieldErrors.unit && <p className="text-red-500 text-[9px] mt-1 font-bold uppercase tracking-tighter">{fieldErrors.unit}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
            <button onClick={handleSave} className="px-10 py-2.5 bg-orange-700 text-white rounded-xl font-bold hover:bg-orange-800 shadow-lg shadow-orange-700/20 transition-all active:scale-95">Update Safety Policy</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default VitalsConfigPage;
