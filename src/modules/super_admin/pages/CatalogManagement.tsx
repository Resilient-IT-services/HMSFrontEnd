'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { catalogService } from '@/services/catalogService';
import { Department, Specialization } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

type CatalogType = 'DEPARTMENT' | 'SPECIALIZATION';

export function CatalogManagement() {
  const [activeTab, setActiveTab] = useState<CatalogType>('DEPARTMENT');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptRes, specRes] = await Promise.all([
        catalogService.getAllDepartments(),
        catalogService.getAllSpecializations()
      ]);

      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (specRes.success && specRes.data) setSpecializations(specRes.data);
    } catch (error) {
      console.error('Failed to fetch catalog data', error);
      triggerGlobalToast('Failed to load catalog data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        active: item.active
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const isDept = activeTab === 'DEPARTMENT';
      const res = isDept
        ? (editingItem 
            ? await catalogService.updateDepartment(editingItem.id, formData)
            : await catalogService.createDepartment(formData))
        : (editingItem
            ? await catalogService.updateSpecialization(editingItem.id, formData)
            : await catalogService.createSpecialization(formData));

      if (res.success) {
        triggerGlobalToast(`${isDept ? 'Department' : 'Specialization'} saved successfully`, 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save item', error);
      triggerGlobalToast('Failed to save item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    try {
      const isDept = activeTab === 'DEPARTMENT';
      const updatedData = { ...item, active: !item.active };
      const res = isDept
        ? await catalogService.updateDepartment(item.id, updatedData)
        : await catalogService.updateSpecialization(item.id, updatedData);

      if (res.success) {
        triggerGlobalToast(`Status updated successfully`, 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update status', error);
      triggerGlobalToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const isDept = activeTab === 'DEPARTMENT';
      const res = isDept
        ? await catalogService.deleteDepartment(id)
        : await catalogService.deleteSpecialization(id);

      if (res.success) {
        triggerGlobalToast('Item deleted successfully', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete item', error);
      triggerGlobalToast('Failed to delete item', 'error');
    }
  };

  const currentList = activeTab === 'DEPARTMENT' ? departments : specializations;

  return (
    <MainLayout title="Catalog Management" hideGlobalSearch={true}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-headline-xl text-[var(--on-surface)]">Master Catalog Management</h2>
            <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Manage hospital departments and medical specializations used across the system.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Add {activeTab === 'DEPARTMENT' ? 'Department' : 'Specialization'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('DEPARTMENT')}
            className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] transition-all border-b-2 ${
              activeTab === 'DEPARTMENT' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('SPECIALIZATION')}
            className={`px-8 py-4 font-black uppercase tracking-widest text-[10px] transition-all border-b-2 ${
              activeTab === 'SPECIALIZATION' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Specializations
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
            Loading catalog data...
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100">
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Name</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Description</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No items found in this category.
                    </td>
                  </tr>
                ) : (
                  currentList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate">{item.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                          item.active 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleToggleStatus(item)}
                            title={item.active ? 'Deactivate' : 'Activate'}
                            className={`p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all ${
                              item.active ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {item.active ? 'block' : 'check_circle'}
                            </span>
                          </button>
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-red-500 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? 'Edit' : 'Add New'} ${activeTab === 'DEPARTMENT' ? 'Department' : 'Specialization'}`}
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="font-label-md text-slate-700 mb-2 block uppercase tracking-widest text-[10px] font-black">Name *</label>
            <input 
              type="text" 
              className="form-input font-bold" 
              required
              placeholder={`e.g. ${activeTab === 'DEPARTMENT' ? 'Cardiology' : 'General Surgery'}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="font-label-md text-slate-700 mb-2 block uppercase tracking-widest text-[10px] font-black">Description</label>
            <textarea 
              className="form-input min-h-[100px] font-medium" 
              placeholder="Optional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Active Status</p>
              <p className="text-[10px] text-slate-400">Enable or disable this item in dropdowns.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              {submitting ? 'Saving...' : 'Save Catalog Item'}
            </button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
