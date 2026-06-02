'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { labApi, LabDepartmentDTO, LabTestDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function LabTestsPage() {
  const [tests, setTests] = useState<LabTestDTO[]>([]);
  const [departments, setDepartments] = useState<LabDepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LabTestDTO>({
    testCode: '',
    testName: '',
    departmentId: '',
    resultType: 'NUMERIC',
    active: true
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [testsRes, deptsRes] = await Promise.all([
        labApi.getTests(),
        labApi.getDepartments()
      ]);
      if (testsRes.success && testsRes.data) setTests(testsRes.data);
      if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ testCode: '', testName: '', departmentId: '', resultType: 'NUMERIC', active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (test: LabTestDTO) => {
    setEditingId(test.id!);
    setFormData({ ...test });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await labApi.deleteTest(id);
      if (res.success) {
        triggerGlobalToast('Test deleted', 'success');
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) {
      triggerGlobalToast('Select a department', 'error');
      return;
    }
    try {
      const res = editingId 
        ? await labApi.updateTest(editingId, formData)
        : await labApi.createTest(formData);
        
      if (res.success) {
        triggerGlobalToast(`Test ${editingId ? 'updated' : 'created'}`, 'success');
        setShowModal(false);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <MainLayout title="Lab Tests Catalog">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lab Tests Catalog</h1>
            <p className="text-sm text-slate-500 font-medium">Configure tests, result formats, and TAT.</p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-orange-700 hover:bg-orange-800">
            <span className="material-symbols-outlined mr-2">add</span>
            Add Test
          </Button>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Test Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : tests.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">No tests defined yet.</td></tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-xs">{test.testCode}</td>
                    <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{test.testName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{test.shortName || 'No short name'}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 text-xs uppercase">{test.departmentName}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(test)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-orange-600"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={() => handleDelete(test.id!)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Test" : "Add Test"} size="xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Test Code</label>
              <input value={formData.testCode} onChange={(e) => setFormData({ ...formData, testCode: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" placeholder="e.g. CBC" required />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Test Name</label>
              <input value={formData.testName} onChange={(e) => setFormData({ ...formData, testName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" placeholder="e.g. Complete Blood Count" required />
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Department</label>
              <select value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" required>
                <option value="">Select Department</option>
                {departments.filter(d => d.active).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Result Type</label>
              <select value={formData.resultType} onChange={(e) => setFormData({ ...formData, resultType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all">
                <option value="NUMERIC">NUMERIC</option>
                <option value="TEXT">TEXT</option>
                <option value="MULTI_PARAMETER">MULTI_PARAMETER</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Test</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
