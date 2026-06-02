'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { labApi, LabDepartmentDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function LabDepartmentsPage() {
  const [departments, setDepartments] = useState<LabDepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LabDepartmentDTO>({
    code: '',
    name: '',
    active: true
  });

  const fetchDepartments = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await labApi.getDepartments();
      if (res.success && res.data) setDepartments(res.data);
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (dept: LabDepartmentDTO) => {
    setEditingId(dept.id!);
    setFormData({ ...dept });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await labApi.deleteDepartment(id);
      if (res.success) {
        triggerGlobalToast('Department deleted', 'success');
        fetchDepartments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = editingId 
        ? await labApi.updateDepartment(editingId, formData)
        : await labApi.createDepartment(formData);
        
      if (res.success) {
        triggerGlobalToast(`Department ${editingId ? 'updated' : 'created'}`, 'success');
        setShowModal(false);
        fetchDepartments();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout title="Lab Departments">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lab Departments</h1>
            <p className="text-sm text-slate-500 font-medium">Manage functional units within the laboratory.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-orange-700 hover:bg-orange-800">
            <span className="material-symbols-outlined mr-2">add</span>
            Add Department
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : departments.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No departments defined yet.</td></tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-xs">{dept.code}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{dept.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        dept.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {dept.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(dept)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-orange-600"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={() => handleDelete(dept.id!)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Department" : "Add Department"} size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Code</label>
              <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" placeholder="e.g. HEM" required />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" placeholder="e.g. Hematology" required />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500" />
                <span className="text-xs font-black uppercase text-slate-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Department</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
