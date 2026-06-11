'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { labApi, HospitalLabTestConfigDTO } from '@/modules/lab/api/labApi';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const HospitalLabSettingsPage = () => {
  const [tests, setTests] = useState<HospitalLabTestConfigDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [editingTest, setEditingTest] = useState<HospitalLabTestConfigDTO | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await labApi.getAdminTests();
      if (response.success && response.data) {
        setTests(response.data);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error('Failed to fetch hospital lab settings:', error);
      triggerGlobalToast('Failed to load laboratory settings', 'error');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleEditClick = (test: HospitalLabTestConfigDTO) => {
    setEditingTest({ ...test }); // Clone to avoid direct mutation
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    try {
      setIsSaving(true);
      const response = await labApi.configureAdminTest(editingTest);
      if (response.success) {
        triggerGlobalToast('Test configured successfully', 'success');
        setEditingTest(null);
        fetchTests();
      }
    } catch (error) {
      console.error('Failed to configure test:', error);
      triggerGlobalToast('Failed to save test configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<HospitalLabTestConfigDTO>[] = [
    {
      header: 'Test Details',
      render: (t) => (
        <div>
          <p className="text-sm font-bold text-slate-900">{t.testName}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.testCode}</p>
        </div>
      )
    },
    {
      header: 'Department',
      render: (t) => <span className="text-xs font-bold text-slate-600">{t.departmentName || '-'}</span>
    },
    {
      header: 'Status',
      render: (t) => (
        <Badge variant={t.enabled ? 'emerald' : 'slate'} size="sm">
          {t.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      )
    },
    {
      header: 'TAT',
      render: (t) => (
        <span className="text-xs font-bold text-slate-700">
          {t.tatValue ? `${t.tatValue} ${t.tatUnit}` : '-'}
        </span>
      )
    },
    {
      header: 'Standard Price',
      render: (t) => (
        <span className="text-xs font-bold text-slate-900">
          {t.standardPrice ? `₹${t.standardPrice}` : '-'}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (t) => (
        <Button variant="secondary" size="sm" onClick={() => handleEditClick(t)}>
          Configure
        </Button>
      )
    }
  ];

  return (
    <MainLayout title="Hospital Lab Settings">
      <PageSurface>
        <div className="space-y-4 py-4">
          <PageHeading
            title="Hospital Lab Settings"
            description="Enable global tests for your hospital and configure local pricing and Turn-Around Times."
          />

          <ContentPanel>
            <Table
              columns={columns}
              data={tests}
              isLoading={loading}
            />
          </ContentPanel>
        </div>

        {/* Configuration Modal */}
        {editingTest && (
          <Modal
            isOpen={true}
            onClose={() => setEditingTest(null)}
            title={`Configure: ${editingTest.testName}`}
            size="lg"
          >
            <form onSubmit={handleSave} className="p-6 space-y-6">
              
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                 <div>
                    <h4 className="text-sm font-bold text-slate-900">Enable Test</h4>
                    <p className="text-xs text-slate-500">Make this test available for doctors to prescribe.</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editingTest.enabled}
                      onChange={(e) => setEditingTest({ ...editingTest, enabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Standard Price (₹)</label>
                    <input 
                      type="number"
                      value={editingTest.standardPrice || ''}
                      onChange={(e) => setEditingTest({ ...editingTest, standardPrice: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                      placeholder="e.g. 500" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Emergency Price (₹)</label>
                    <input 
                      type="number"
                      value={editingTest.emergencyPrice || ''}
                      onChange={(e) => setEditingTest({ ...editingTest, emergencyPrice: parseFloat(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                      placeholder="e.g. 800" 
                    />
                 </div>
              </div>

              {/* TAT Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">Turn Around Time (Value)</label>
                    <input 
                      type="number"
                      value={editingTest.tatValue || ''}
                      onChange={(e) => setEditingTest({ ...editingTest, tatValue: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium" 
                      placeholder="e.g. 24" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2 ml-1">TAT Unit</label>
                    <select
                      value={editingTest.tatUnit || 'Hours'}
                      onChange={(e) => setEditingTest({ ...editingTest, tatUnit: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    >
                       <option value="Minutes">Minutes</option>
                       <option value="Hours">Hours</option>
                       <option value="Days">Days</option>
                    </select>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setEditingTest(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  Save Configuration
                </Button>
              </div>

            </form>
          </Modal>
        )}
      </PageSurface>
    </MainLayout>
  );
};

export default HospitalLabSettingsPage;
