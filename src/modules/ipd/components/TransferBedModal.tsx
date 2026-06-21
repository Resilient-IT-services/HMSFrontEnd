'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ipdService } from '@/services/ipdService';
import { WardDTO, BedDTO, AdmissionResponseDTO } from '@/types/ipd';
import { useToast } from '@/components/ui/Toast';

interface TransferBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admission: AdmissionResponseDTO;
}

export const TransferBedModal = ({ isOpen, onClose, onSuccess, admission }: TransferBedModalProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [beds, setBeds] = useState<BedDTO[]>([]);
  
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    async function loadWards() {
      try {
        const res = await ipdService.listWards({ size: 100 });
        if (res.success) {
          setWards(res.data?.content || []);
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load wards', 'error');
      }
    }
    loadWards();
  }, [showToast]);

  useEffect(() => {
    async function loadBeds(wardId: string) {
      if (!wardId) {
        setBeds([]);
        setSelectedBedId('');
        return;
      }
      try {
        const res = await ipdService.listWardBeds(wardId);
        if (res.success) {
          // Filter to show only AVAILABLE beds
          setBeds(res.data?.filter(b => b.status === 'AVAILABLE' && b.active) || []);
        }
      } catch (error) {
        console.error(error);
        showToast('Failed to load beds', 'error');
      }
    }
    loadBeds(selectedWardId);
  }, [selectedWardId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) {
      showToast('Please select a new bed', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await ipdService.transferBed(admission.id, {
        toBedId: selectedBedId,
        transferReason,
        remarks
      });
      if (res.success) {
        showToast('Bed transferred successfully', 'success');
        onSuccess();
      } else {
        showToast(res.message || 'Transfer failed', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'An error occurred during transfer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Bed" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Current Ward">
            <input 
              type="text" 
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 outline-none"
              value={admission.wardName}
              disabled
            />
          </FormField>

          <FormField label="Current Bed">
            <input 
              type="text" 
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 outline-none"
              value={`Bed ${admission.bedNumber}`}
              disabled
            />
          </FormField>

          <FormField label="New Ward" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={selectedWardId}
              onChange={(e) => {
                setSelectedWardId(e.target.value);
                setSelectedBedId('');
              }}
              required
            >
              <option value="">Select Ward</option>
              {wards.map(w => (
                <option key={w.id} value={w.id}>{w.wardName} ({w.wardType})</option>
              ))}
            </select>
          </FormField>

          <FormField label="New Bed" required>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all"
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              required
              disabled={!selectedWardId}
            >
              <option value="">Select Bed</option>
              {beds.map(b => (
                <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Transfer Reason" required>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all min-h-[80px]"
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="Reason for transfer..."
            required
          />
        </FormField>

        <FormField label="Remarks">
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all min-h-[60px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional comments..."
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Confirm Transfer</Button>
        </div>
      </form>
    </Modal>
  );
};
