'use client';

import React, { useEffect, useState } from 'react';
import { useIpd } from '@/modules/ipd/hooks/useIpd';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeader } from '@/components/ui/PageHeader';
import { WardDTO, WardType } from '@/types/ipd';
import { WARD_TYPE_OPTIONS } from '@/utils/enumOptions';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { FormField } from '@/components/ui/FormField';
import { ipdService } from '@/services/ipdService';
import { useToast } from '@/components/ui/Toast';
import BedManagementModal from '../components/BedManagementModal';

export const WardBedManagement = () => {
  const { showToast } = useToast();
  const { wards, loading, fetchWards } = useIpd();
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [selectedWard, setSelectedWard] = useState<WardDTO | null>(null);
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [wardForBeds, setWardForBeds] = useState<WardDTO | null>(null);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  const handleSaveWard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: WardDTO = {
      wardCode: formData.get('wardCode') as string,
      wardName: formData.get('wardName') as string,
      wardType: formData.get('wardType') as WardType,
      totalBeds: Number.parseInt(formData.get('totalBeds') as string, 10) || 0,
      active: true,
      remarks: formData.get('remarks') as string
    };

    try {
      const res = selectedWard?.id 
        ? await ipdService.updateWard(selectedWard.id, data) 
        : await ipdService.createWard(data);

      if (res.success) {
        showToast(`Ward ${selectedWard ? 'updated' : 'created'} successfully`, 'success');
        setIsWardModalOpen(false);
        fetchWards();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save ward', 'error');
    }
  };

  const columns: Column<WardDTO>[] = [
    {
      header: 'Code',
      key: 'wardCode',
      render: (row) => <span className="font-bold text-slate-900">{row.wardCode}</span>
    },
    {
      header: 'Ward Name',
      key: 'wardName',
      render: (row) => <span className="font-medium text-slate-700">{row.wardName}</span>
    },
    {
      header: 'Type',
      key: 'wardType',
      render: (row) => <Badge variant="blue">{WARD_TYPE_OPTIONS.find(o => o.value === row.wardType)?.label || row.wardType}</Badge>
    },
    {
      header: 'Beds',
      key: 'totalBeds',
      render: (row) => <span className="font-bold">{row.totalBeds}</span>
    },
    {
      header: 'Status',
      key: 'active',
      render: (row) => <Badge variant={row.active ? 'emerald' : 'slate'}>{row.active ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2"
            onClick={() => { setSelectedWard(row); setIsWardModalOpen(true); }}
            title="Edit Ward"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-2 border-orange-200 text-orange-600 hover:bg-orange-50"
            onClick={() => { setWardForBeds(row); setIsBedModalOpen(true); }}
            title="Manage Beds"
          >
            <span className="material-symbols-outlined text-sm">bed</span>
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageSurface>
      <PageHeader 
        title="Ward Management" 
        headerActions={
          <Button 
            icon="add" 
            onClick={() => { setSelectedWard(null); setIsWardModalOpen(true); }}
            className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20"
          >
            Create Ward
          </Button>
        }
      />

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mt-6">
        <Table 
          data={wards?.content || []} 
          columns={columns} 
          isLoading={loading}
        />
        {wards && wards.totalElements > 0 && (
          <Pagination 
            page={wards.page}
            totalElements={wards.totalElements}
            pageSize={wards.size}
            onPageChange={(page) => fetchWards(page)}
            label="wards"
          />
        )}
      </div>

      <Modal 
        isOpen={isWardModalOpen} 
        onClose={() => setIsWardModalOpen(false)} 
        title={selectedWard ? 'Edit Ward' : 'Create Ward'}
        size="md"
      >
        <form onSubmit={handleSaveWard} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Ward Code" required>
              <input 
                name="wardCode"
                defaultValue={selectedWard?.wardCode}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                required
                placeholder="e.g. W01"
              />
            </FormField>
            <FormField label="Ward Name" required>
              <input 
                name="wardName"
                defaultValue={selectedWard?.wardName}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                required
                placeholder="e.g. General Ward 1"
              />
            </FormField>
            <FormField label="Ward Type" required>
              <select 
                name="wardType"
                defaultValue={selectedWard?.wardType || 'GENERAL'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                required
              >
                {WARD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Total Bed Capacity" required>
              <input 
                name="totalBeds"
                type="number"
                defaultValue={selectedWard?.totalBeds || 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                required
              />
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea 
              name="remarks"
              defaultValue={selectedWard?.remarks}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[80px]"
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsWardModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Ward</Button>
          </div>
        </form>
      </Modal>

      {wardForBeds && (
        <BedManagementModal 
          isOpen={isBedModalOpen}
          onClose={() => { setIsBedModalOpen(false); setWardForBeds(null); fetchWards(); }}
          ward={wardForBeds}
        />
      )}
    </PageSurface>
  );
};
