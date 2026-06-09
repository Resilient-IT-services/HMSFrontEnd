'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { adminService } from '@/services/adminService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';

export function VitalsConfigPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    minValue: 0,
    maxValue: 0,
    errorMessage: ''
  });

  const VITAL_TYPES = [
    { value: 'vitals_temperatureF', label: 'Body Temperature (°F)' },
    { value: 'vitals_systolic', label: 'Systolic BP (mmHg)' },
    { value: 'vitals_diastolic', label: 'Diastolic BP (mmHg)' },
    { value: 'vitals_heartRate', label: 'Heart Rate (bpm)' },
    { value: 'vitals_oxygenLevel', label: 'Oxygen Level (%)' },
    { value: 'vitals_weight', label: 'Weight (kg)' },
  ];

  const legacyKeys: Record<string, string> = {
    'vitals_temperatureF': 'BODY_TEMPERATURE',
    'vitals_systolic': 'SYSTOLIC_BP',
    'vitals_diastolic': 'DIASTOLIC_BP',
    'vitals_heartRate': 'HEART_RATE',
    'vitals_oxygenLevel': 'OXYGEN_LEVEL',
    'vitals_weight': 'WEIGHT'
  };

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listVitalSettings();
      if (res.success && res.data) {
        const configMap: Record<string, any> = {};
        res.data.forEach((item: any) => {
          configMap[item.vitalType] = item;
        });
        setSettings(configMap);
      }
    } catch (error) {
      console.error('Failed to fetch vital settings', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSettings]);

  const handleOpenModal = (type: string, currentRange?: any) => {
    setEditingType(type);
    setFormData({
      minValue: currentRange?.minValue || 0,
      maxValue: currentRange?.maxValue || 0,
      errorMessage: currentRange?.errorMessage || ''
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (formData.minValue >= formData.maxValue) errors.maxValue = 'Max must be greater than min';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editingType || !validate()) {
      return;
    }
    try {
      // Find the actual record we are editing (it might be under a legacy key in settings)
      const existingRecord = settings[editingType] || settings[legacyKeys[editingType]];
      
      // If we found a legacy record, we update ITS vitalType to migrate it, or use new key for new records
      const targetVitalType = existingRecord ? existingRecord.vitalType : editingType;

      const res = await adminService.saveVitalSetting({
        id: existingRecord?.id,
        vitalType: targetVitalType,
        minValue: formData.minValue,
        maxValue: formData.maxValue,
        errorMessage: formData.errorMessage
      });
      if (res.success) {
        triggerGlobalToast(`${getVitalLabel(editingType)} updated successfully`, 'success');
        setIsModalOpen(false);
        fetchSettings();
      }
    } catch {
      // Interceptor handles toast
    }
  };

  const getVitalLabel = (value: string) => {
    return VITAL_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <MainLayout title="Global Vitals Configuration">
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Global Vitals Configuration"
            description="Configure standard medical vital thresholds applied across all hospitals in the system."
          />

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-3xl">health_metrics</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Global Clinical Standard</h2>
                <p className="text-sm text-slate-500 italic">Centralized safety enforcement protocols.</p>
              </div>
            </div>
            <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-green-100">Active Enforcement</span>
          </div>

          <ContentPanel>
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-medium">Loading global medical policies...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vital Metric</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Safety Range (Min - Max)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {VITAL_TYPES.map((type) => {
                      const range = settings[type.value] || settings[legacyKeys[type.value]];
                      return (
                        <tr 
                          key={type.value} 
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          onDoubleClick={() => handleOpenModal(type.value, range)}
                        >
                          <td className="px-6 py-4 font-bold text-slate-700">{type.label}</td>
                          <td className="px-6 py-4 text-center">
                            {range ? (
                              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                {range.minValue} — {range.maxValue}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic text-xs">Awaiting Initialization...</span>
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
            )}
          </ContentPanel>
        </div>
      </PageSurface>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingType ? `Update Global Medical Policy: ${getVitalLabel(editingType)}` : 'Config'}
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex gap-3">
            <span className="material-symbols-outlined text-orange-600">policy</span>
            <p className="text-xs text-orange-800 italic leading-relaxed font-medium">
              You are modifying a <span className="font-black underline">SYSTEM-WIDE POLICY</span>. 
              Changes will immediately affect clinical intake and validation across all hospitals.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="max-w-[50%]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Policy Minimum</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm"
                value={formData.minValue}
                onChange={(e) => setFormData({...formData, minValue: Number(e.target.value)})}
              />
            </div>
            <div className="max-w-[50%]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Policy Maximum</label>
              <input 
                type="number" 
                className={`w-full bg-slate-50 border ${fieldErrors.maxValue ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm`}
                value={formData.maxValue}
                onChange={(e) => setFormData({...formData, maxValue: Number(e.target.value)})}
              />
              {fieldErrors.maxValue && <p className="text-red-500 text-[9px] mt-1 font-bold uppercase tracking-tighter animate-bounce">{fieldErrors.maxValue}</p>}
            </div>
            <div className="w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Custom Violation Message</label>
              <input 
                type="text" 
                placeholder="e.g. Systolic BP out of safe clinical range (50-250 mmHg)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all shadow-sm"
                value={formData.errorMessage}
                onChange={(e) => setFormData({...formData, errorMessage: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
            <button onClick={handleSave} className="px-10 py-2.5 bg-orange-700 text-white rounded-xl font-bold hover:bg-orange-800 shadow-lg shadow-orange-700/20 transition-all active:scale-95 text-xs uppercase">Commit Global Policy</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
