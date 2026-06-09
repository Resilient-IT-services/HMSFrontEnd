'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/services/userService';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userId }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) {
      triggerGlobalToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      triggerGlobalToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await userService.resetPassword(userId, { newPassword: password });
      if (res.success) {
        triggerGlobalToast('Password changed successfully', 'success');
        setPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        triggerGlobalToast(res.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Failed to change password', error);
      triggerGlobalToast('An error occurred while changing password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
          <input 
            type="password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter new password"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
          <input 
            type="password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
        </div>
        <div className="pt-4 flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
