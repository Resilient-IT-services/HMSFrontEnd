'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { taxService } from '@/services/taxService';
import { TaxGroupDTO, TaxMasterDTO } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function TaxGroupsPage() {
  const [groups, setGroups] = useState<TaxGroupDTO[]>([]);
  const [masters, setMasters] = useState<TaxMasterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<{
    name: string;
    active: boolean;
    taxIds: string[];
  }>({
    name: '',
    active: true,
    taxIds: []
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [groupsRes, mastersRes] = await Promise.all([
        taxService.getAllGroups(),
        taxService.getAllMasters()
      ]);
      if (groupsRes.success && groupsRes.data) setGroups(groupsRes.data);
      if (mastersRes.success && mastersRes.data) setMasters(mastersRes.data);
    } catch (error) {
      console.error('Failed to fetch tax data', error);
      triggerGlobalToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewGroup({ name: '', active: true, taxIds: [] });
    setShowAddModal(true);
  };

  const handleOpenEdit = (group: TaxGroupDTO) => {
    setEditingId(group.id!);
    setNewGroup({
      name: group.name,
      active: group.active,
      taxIds: group.taxes.map(t => t.id!)
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax group?')) return;
    try {
      const response = await taxService.deleteGroup(id);
      if (response.success) {
        triggerGlobalToast('Tax group deleted successfully', 'success');
        void fetchData();
      }
    } catch (error) {
      console.error('Failed to delete tax group', error);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroup.taxIds.length === 0) {
      triggerGlobalToast('Select at least one tax master', 'error');
      return;
    }

    try {
      const selectedTaxes = masters.filter(m => newGroup.taxIds.includes(m.id!));
      const payload = {
        name: newGroup.name,
        active: newGroup.active,
        taxes: selectedTaxes
      };

      const response = editingId
        ? await taxService.updateGroup(editingId, payload as any)
        : await taxService.createGroup(payload as any);

      if (response.success) {
        triggerGlobalToast(`Tax group ${editingId ? 'updated' : 'created'} successfully`, 'success');
        setShowAddModal(false);
        void fetchData();
      } else {
        triggerGlobalToast(response.message || `Failed to ${editingId ? 'update' : 'create'} tax group`, 'error');
      }
    } catch (error) {
      console.error(`Failed to ${editingId ? 'update' : 'create'} tax group`, error);
      triggerGlobalToast('An error occurred', 'error');
    }
  };

  const toggleTax = (id: string) => {
    setNewGroup(prev => ({
      ...prev,
      taxIds: prev.taxIds.includes(id) 
        ? prev.taxIds.filter(t => t !== id) 
        : [...prev.taxIds, id]
    }));
  };

  return (
    <MainLayout title="Tax Groups">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tax Groups</h1>
            <p className="text-sm text-slate-500 font-medium">Bundle multiple taxes together (e.g. GST 18% = CGST 9% + SGST 9%).</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-orange-700 hover:bg-orange-800">
            <span className="material-symbols-outlined mr-2">add</span>
            Add Tax Group
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              Loading tax groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              No tax groups defined yet.
            </div>
          ) : (
            groups.map((group) => (
              <Card key={group.id} className="p-6 border-slate-200 shadow-sm hover:border-orange-200 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{group.name}</h3>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    group.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {group.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  {group.taxes.map((tax) => (
                    <div key={tax.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{tax.name}</span>
                      <span className="text-xs font-black text-slate-900">{tax.rate}%</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total: {group.taxes.reduce((acc, t) => acc + t.rate, 0)}%
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(group)}
                      className="text-slate-400 hover:text-orange-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(group.id!)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingId ? "Edit Tax Group" : "Add Tax Group"}
        size="lg"
      >
        <form onSubmit={handleAddGroup} className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Group Name</label>
            <input 
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all"
              placeholder="e.g. Standard GST 18%"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Select Tax Masters</label>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-1">
              {masters.filter(m => m.active).map((master) => (
                <div 
                  key={master.id}
                  onClick={() => toggleTax(master.id!)}
                  className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${
                    newGroup.taxIds.includes(master.id!) 
                      ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/5' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      newGroup.taxIds.includes(master.id!) ? 'bg-orange-700 border-orange-700' : 'bg-white border-slate-300'
                    }`}>
                      {newGroup.taxIds.includes(master.id!) && <span className="material-symbols-outlined text-white text-[12px] font-black">check</span>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{master.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{master.code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">{master.rate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={newGroup.active}
              onChange={(e) => setNewGroup({ ...newGroup, active: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
            />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Group</span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Tax Group</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
