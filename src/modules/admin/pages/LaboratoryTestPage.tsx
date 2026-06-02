'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { laboratoryApi } from '@/services/laboratoryService';
import { LaboratoryTestDTO } from '@/types/api';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import AddLaboratoryTestModal from './AddLaboratoryTestModal';

const LaboratoryTestPage = () => {
  const [tests, setTests] = useState<LaboratoryTestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await laboratoryApi.getTests();
      if (response.success && response.data) {
        setTests(response.data);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
      triggerGlobalToast('Failed to fetch laboratory tests', 'error');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTests();
  }, [fetchTests]);

  const columns: Column<LaboratoryTestDTO>[] = [
    {
      header: 'Test Code',
      render: (t) => <span className="text-sm font-bold text-slate-900">{t.testCode}</span>
    },
    {
      header: 'Test Name',
      render: (t) => (
        <div>
          <p className="text-sm font-bold text-slate-900">{t.testName}</p>
          {t.aliasName && <p className="text-[10px] text-slate-400 font-medium">Alias: {t.aliasName}</p>}
        </div>
      )
    },
    {
      header: 'Short Name',
      render: (t) => <span className="text-xs text-slate-600">{t.shortName || '-'}</span>
    },
    {
      header: 'HSN/SAC',
      render: (t) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.hsnCode ? `HSN: ${t.hsnCode}` : ''}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.sacCode ? `SAC: ${t.sacCode}` : ''}</span>
          {!t.hsnCode && !t.sacCode && <span className="text-[10px] text-slate-300">-</span>}
        </div>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (t) => (
        <Badge variant={t.active ? 'emerald' : 'slate'} size="sm">
          {t.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  return (
    <MainLayout title="Laboratory Test Master">
      <PageSurface>
        <div className="space-y-4 py-4">
          <PageHeading
            title="Laboratory Test Master"
            description="Configure and manage the central laboratory test catalog."
          >
            <Button icon="add" onClick={() => setShowAddModal(true)}>
              Add Laboratory Test
            </Button>
          </PageHeading>

          <ContentPanel>
            <Table
              columns={columns}
              data={tests}
              isLoading={loading}
            />
          </ContentPanel>
        </div>

        {showAddModal && (
          <AddLaboratoryTestModal
            isOpen={true}
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchTests}
          />
        )}
      </PageSurface>
    </MainLayout>
  );
};

export default LaboratoryTestPage;
