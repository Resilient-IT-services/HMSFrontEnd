'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { adminService, VitalSetting } from '@/services/adminService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

const VitalsConfigPage = () => {
  const [settings, setSettings] = useState<VitalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<VitalSetting | null>(null);

  const [formData, setFormData] = useState<VitalSetting>({
    vitalName: '',
    minValue: 0,
    maxValue: 0,
    unit: ''
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminService.listVitalSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch vital settings', error);
      triggerGlobalToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleOpenModal = (setting?: VitalSetting) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData(setting);
    } else {
      setEditingSetting(null);
      setFormData({
        vitalName: '',
        minValue: 0,
        maxValue: 0,
        unit: ''
      });
    }
    setIsModalOpen(true);
  };

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.vitalName.trim()) errors.vitalName = 'Vital name is required';
    else if (formData.vitalName.length < 2) errors.vitalName = 'Vital name is too short';
    
    if ((formData.minValue ?? 0) >= (formData.maxValue ?? 0)) errors.maxValue = 'Max must be greater than min';
    if (!formData.unit?.trim()) errors.unit = 'Default unit is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      triggerGlobalToast('Please fix the validation errors', 'error');
      return;
    }
    try {
      const res = await adminService.saveVitalSetting(formData);
      if (res.success) {
        triggerGlobalToast(`Setting ${editingSetting ? 'updated' : 'created'} successfully`, 'success');
        setIsModalOpen(false);
        fetchSettings();
      }
    } catch (error) {
      triggerGlobalToast('Failed to save setting', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('Are you sure you want to delete this setting?')) return;
    try {
      // Note: deleteVitalSetting was removed from adminService to match docs.
      triggerGlobalToast('Delete not implemented in current API spec', 'warning');
    } catch (error) {
      triggerGlobalToast('Failed to delete setting', 'error');
    }
  };

  return (
    <MainLayout title="Vitals Configuration">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Clinical Vitals Management</h2>
            <p className="text-sm text-slate-500">Define ranges and units for patient vitals.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="px-6 py-2 bg-orange-700 text-white rounded-xl font-bold hover:bg-orange-800 transition-all flex items-center gap-2 shadow-lg shadow-orange-700/20"
          >
            <span className="material-symbols-outlined">add</span>
            Add Vital
          </button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vital Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Range (Min - Max)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Unit</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Options</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Loading configuration...</td></tr>
                ) : settings.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No vitals configured.</td></tr>
                ) : settings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{s.vitalName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                        {s.minValue} - {s.maxValue}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{s.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold">{s.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpenModal(s)} className="p-1.5 text-slate-400 hover:text-orange-600 transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingSetting ? `Edit ${editingSetting.vitalName}` : 'Add New Vital'}
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vital Name</label>
              <input 
                type="text" 
                className={`w-full bg-slate-50 border ${fieldErrors.vitalName ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none`}
                placeholder="e.g. Temperature"
                value={formData.vitalName}
                onChange={(e) => setFormData({...formData, vitalName: e.target.value})}
              />
              {fieldErrors.vitalName && <p className="text-red-500 text-[9px] mt-1 font-bold">{fieldErrors.vitalName}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Min Value</label>
              <input 
                type="number" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none"
                value={formData.minValue}
                onChange={(e) => setFormData({...formData, minValue: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Max Value</label>
              <input 
                type="number" 
                className={`w-full bg-slate-50 border ${fieldErrors.maxValue ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none`}
                value={formData.maxValue}
                onChange={(e) => setFormData({...formData, maxValue: Number(e.target.value)})}
              />
              {fieldErrors.maxValue && <p className="text-red-500 text-[9px] mt-1 font-bold">{fieldErrors.maxValue}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Default Unit</label>
              <input 
                type="text" 
                className={`w-full bg-slate-50 border ${fieldErrors.unit ? 'border-red-500' : 'border-slate-200'} rounded-lg px-4 py-2.5 font-bold focus:ring-2 focus:ring-orange-200 outline-none`}
                placeholder="e.g. CELSIUS or KG"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value.toUpperCase()})}
              />
              {fieldErrors.unit && <p className="text-red-500 text-[9px] mt-1 font-bold">{fieldErrors.unit}</p>}
              <p className="text-[9px] text-slate-400 mt-1">Use uppercase (e.g., CELSIUS, FAHRENHEIT, KG, LB, MMHG)</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleSave} className="px-8 py-2.5 bg-orange-700 text-white rounded-xl font-bold hover:bg-orange-800 shadow-lg shadow-orange-700/20 transition-all">Save Changes</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default VitalsConfigPage;
