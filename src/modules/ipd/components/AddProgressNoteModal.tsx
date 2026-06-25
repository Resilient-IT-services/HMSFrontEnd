'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';

interface AddProgressNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<any>;
}

export const AddProgressNoteModal = ({ isOpen, onClose, onSubmit }: AddProgressNoteModalProps) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      showToast('Progress note cannot be empty', 'error');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(note.trim());
      showToast('Progress note added successfully', 'success');
      setNote('');
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error?.message || error.message || 'Failed to add progress note';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Progress Note" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <FormField label="Progress Note" required>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 transition-all min-h-[120px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter clinical notes, patient status, or observation details..."
            required
            disabled={loading}
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
};
