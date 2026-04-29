'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { triggerGlobalToast } from '@/components/ui/Toast';

const VitalsConfigPage = () => {
  const [config, setConfig] = useState(() => {
    if (globalThis.window !== undefined) {
      const saved = localStorage.getItem('vitals_config');
      if (saved) return JSON.parse(saved);
    }
    return {
      temperature: { min: 35, max: 42, unit: '°C' },
      weight: { min: 0, max: 500, unit: 'kg' },
      heartRate: { min: 30, max: 250 },
      oxygenLevel: { min: 70, max: 100 },
      systolic: { min: 70, max: 250 },
      diastolic: { min: 40, max: 150 }
    };
  });

  const handleSave = () => {
    localStorage.setItem('vitals_config', JSON.stringify(config));
    triggerGlobalToast('Vitals configuration saved successfully', 'success');
  };

  return (
    <MainLayout title="Vitals Configuration">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Vitals Thresholds & Units</h2>
            <p className="text-sm text-slate-500">Configure global validation rules for patient vitals.</p>
          </div>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-orange-700 text-white rounded-xl font-bold hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20"
          >
            Save Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">thermometer</span>
              Temperature
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Default Unit</span>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                  value={config.temperature.unit}
                  onChange={(e) => setConfig({ ...config, temperature: { ...config.temperature, unit: e.target.value } })}
                >
                  <option value="°C">Celsius (°C)</option>
                  <option value="°F">Fahrenheit (°F)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Min Value</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    value={config.temperature.min}
                    onChange={(e) => setConfig({ ...config, temperature: { ...config.temperature, min: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Max Value</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    value={config.temperature.max}
                    onChange={(e) => setConfig({ ...config, temperature: { ...config.temperature, max: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Weight */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">weight</span>
              Weight
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Default Unit</span>
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                  value={config.weight.unit}
                  onChange={(e) => setConfig({ ...config, weight: { ...config.weight, unit: e.target.value } })}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Min Value</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    value={config.weight.min}
                    onChange={(e) => setConfig({ ...config, weight: { ...config.weight, min: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Max Value</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    value={config.weight.max}
                    onChange={(e) => setConfig({ ...config, weight: { ...config.weight, max: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Oxygen Level */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">air</span>
              Oxygen Level (SpO2)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Min %</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                  value={config.oxygenLevel.min}
                  onChange={(e) => setConfig({ ...config, oxygenLevel: { ...config.oxygenLevel, min: Number(e.target.value) } })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Max %</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                  value={config.oxygenLevel.max}
                  onChange={(e) => setConfig({ ...config, oxygenLevel: { ...config.oxygenLevel, max: Number(e.target.value) } })}
                />
              </div>
            </div>
          </Card>

          {/* Blood Pressure */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600">monitor_heart</span>
              Blood Pressure
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Systolic Thresholds</p>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    placeholder="Min"
                    value={config.systolic.min}
                    onChange={(e) => setConfig({ ...config, systolic: { ...config.systolic, min: Number(e.target.value) } })}
                  />
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    placeholder="Max"
                    value={config.systolic.max}
                    onChange={(e) => setConfig({ ...config, systolic: { ...config.systolic, max: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Diastolic Thresholds</p>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    placeholder="Min"
                    value={config.diastolic.min}
                    onChange={(e) => setConfig({ ...config, diastolic: { ...config.diastolic, min: Number(e.target.value) } })}
                  />
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold"
                    placeholder="Max"
                    value={config.diastolic.max}
                    onChange={(e) => setConfig({ ...config, diastolic: { ...config.diastolic, max: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VitalsConfigPage;
