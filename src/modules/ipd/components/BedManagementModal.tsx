'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { ipdService } from '@/services/ipdService';
import { WardDTO, BedDTO, BedStatus } from '@/types/ipd';
import { BED_STATUS_OPTIONS } from '@/utils/enumOptions';
import { useToast } from '@/components/ui/Toast';

interface BedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  ward: WardDTO;
}

const BedManagementModal = ({ isOpen, onClose, ward }: BedManagementModalProps) => {
  const { showToast } = useToast();
  const [beds, setBeds] = useState<BedDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedDTO | null>(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);

  const fetchBeds = useCallback(async () => {
    if (!ward.id) return;
    await Promise.resolve(); // Prevent synchronous setState in useEffect
    setLoading(true);
    try {
      const res = await ipdService.listWardBeds(ward.id);
      if (res.success) {
        const existingBeds = res.data || [];
        setBeds(existingBeds);

        const existingCount = existingBeds.length;
        const missingCount = ward.totalBeds - existingCount;
        if (missingCount > 0) {
          const bedPromises = Array.from({ length: missingCount }, (_, i) => {
            const bedNumber = `B-${String(existingCount + i + 1).padStart(2, '0')}`;
            return ipdService.createBed({ wardId: ward.id!, bedNumber, status: 'AVAILABLE', active: true });
          });
          await Promise.all(bedPromises);
          const refreshed = await ipdService.listWardBeds(ward.id);
          if (refreshed.success) setBeds(refreshed.data || []);
          showToast(`${missingCount} beds auto-generated (B-${String(existingCount + 1).padStart(2, '0')} to B-${String(ward.totalBeds).padStart(2, '0')})`, 'success');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load beds', 'error');
    } finally {
      setLoading(false);
    }
  }, [ward.id, ward.totalBeds, showToast]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchBeds();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchBeds]);

  const handleSaveBed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: BedDTO = {
      wardId: ward.id!,
      bedNumber: formData.get('bedNumber') as string,
      status: (formData.get('status') as BedStatus) || 'AVAILABLE',
      active: true
    };

    try {
      const res = selectedBed?.id 
        ? await ipdService.updateBed(selectedBed.id, data)
        : await ipdService.createBed(data);

      if (res.success) {
        showToast(`Bed ${selectedBed ? 'updated' : 'created'} successfully`, 'success');
        setIsEditPopupOpen(false);
        fetchBeds();
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to save bed', 'error');
    }
  };

  const handleDeleteBed = async (bed: BedDTO) => {
    if (!bed.id) return;
    if (!confirm(`Remove bed ${bed.bedNumber}? This cannot be undone.`)) return;
    try {
      const res = await ipdService.updateBed(bed.id, { ...bed, active: false });
      if (res.success) {
        setBeds(prev => prev.filter(b => b.id !== bed.id));
        showToast(`Bed ${bed.bedNumber} removed`, 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to remove bed', 'error');
    }
  };

  const getStatusVariant = (status: BedStatus) => {
    switch (status) {
      case 'AVAILABLE': { return 'emerald'; }
      case 'OCCUPIED': { return 'orange'; }
      case 'CLEANING': { return 'blue'; }
      case 'MAINTENANCE': { return 'red'; }
      default: { return 'slate'; }
    }
  };

  const columns: Column<BedDTO>[] = [
    {
      header: 'Bed Number',
      key: 'bedNumber',
      render: (row) => <span className="font-bold text-slate-900">{row.bedNumber}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {BED_STATUS_OPTIONS.find(o => o.value === row.status)?.label || row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2"
            onClick={() => { setSelectedBed(row); setIsEditPopupOpen(true); }}
          >
            <span className="material-symbols-outlined text-xs">edit</span>
          </Button>
          <button
            type="button"
            onClick={() => handleDeleteBed(row)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Beds - ${ward.wardName}`} size="lg">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
            Current Capacity: <span className="text-slate-900">{beds.length} / {ward.totalBeds}</span>
          </p>
        </div>

        <Table 
          data={beds} 
          columns={columns} 
          isLoading={loading}
        />

<div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>

      <Modal
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        title="Edit Bed"
        size="sm"
      >
        <div className="p-4">
          <form onSubmit={handleSaveBed} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Bed Number" required>
                <input
                  key={selectedBed?.id}
                  name="bedNumber"
                  defaultValue={selectedBed?.bedNumber}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                  required
                  placeholder="e.g. B-01"
                />
              </FormField>
              <FormField label="Status">
                <select
                  key={selectedBed?.id}
                  name="status"
                  defaultValue={selectedBed?.status || 'AVAILABLE'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
                >
                  {BED_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditPopupOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">Save Bed</Button>
            </div>
          </form>
        </div>
      </Modal>
    </Modal>
  );
};

export default BedManagementModal;
