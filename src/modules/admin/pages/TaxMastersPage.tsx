'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { taxService } from '@/services/taxService';
import { TaxMasterDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function TaxMastersPage() {
  const [masters, setMasters] = useState<TaxMasterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaster, setNewMaster] = useState<TaxMasterDTO>({
    code: '',
    name: '',
    taxType: 'GST',
    rate: 0,
    active: true
  });

  const fetchMasters = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await taxService.getAllMasters();
      if (response.success && response.data) {
        setMasters(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tax masters', error);
      triggerGlobalToast('Failed to load tax masters', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMasters();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMasters]);

  const handleAddMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await taxService.createMaster(newMaster);
      if (response.success) {
        triggerGlobalToast('Tax master created successfully', 'success');
        setShowAddModal(false);
        setNewMaster({ code: '', name: '', taxType: 'GST', rate: 0, active: true });
        void fetchMasters();
      } else {
        triggerGlobalToast(response.message || 'Failed to create tax master', 'error');
      }
    } catch (error) {
      console.error('Failed to create tax master', error);
      triggerGlobalToast('An error occurred', 'error');
    }
  };

  return (
    <MainLayout title="Tax Masters">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tax Masters</h1>
            <p className="text-sm text-slate-500 font-medium">Define individual tax components and rates.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-orange-700 hover:bg-orange-800">
            <span className="material-symbols-outlined mr-2">add</span>
            Add Tax Master
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Rate (%)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Loading tax masters...
                  </td>
                </tr>
              ) : masters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    No tax masters defined yet.
                  </td>
                </tr>
              ) : (
                masters.map((master) => (
                  <tr key={master.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                        {master.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">{master.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-orange-700 uppercase">{master.taxType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-900">{master.rate}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        master.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {master.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-orange-600">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Tax Master"
        size="lg"
      >
        <form onSubmit={handleAddMaster} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Tax Code</label>
              <input 
                value={newMaster.code}
                onChange={(e) => setNewMaster({ ...newMaster, code: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. CGST_9"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Tax Type</label>
              <select 
                value={newMaster.taxType}
                onChange={(e) => setNewMaster({ ...newMaster, taxType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              >
                <option value="GST">GST</option>
                <option value="VAT">VAT</option>
                <option value="CESS">CESS</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Tax Name</label>
              <input 
                value={newMaster.name}
                onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. Central GST @ 9%"
                required
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Rate (%)</label>
              <input 
                type="number"
                step="0.01"
                value={newMaster.rate}
                onChange={(e) => setNewMaster({ ...newMaster, rate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
                placeholder="e.g. 9"
                required
              />
            </div>
            <div className="col-span-1 flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newMaster.active}
                  onChange={(e) => setNewMaster({ ...newMaster, active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
                />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Tax Master</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
