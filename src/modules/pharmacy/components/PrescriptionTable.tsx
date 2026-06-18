import React from 'react';
import { PrescriptionSummaryDTO } from '@/types/api';
import Link from 'next/link';
import { pharmacyApi } from '../api/pharmacyApi';
import { formatRxNumber } from '@/utils/formatters';

interface PrescriptionTableProps {
  prescriptions: PrescriptionSummaryDTO[];
  loading?: boolean;
  onRefresh?: () => void;
  hospitalName?: string;
}

const PrescriptionTable: React.FC<PrescriptionTableProps> = ({ prescriptions, loading, onRefresh, hospitalName }) => {
  const handleCancel = async (id: string) => {
    if (!globalThis.confirm('Are you sure you want to cancel this prescription? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await pharmacyApi.cancelPrescription(id);
      if (response.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(response.message || 'Failed to cancel prescription');
      }
    } catch (error: any) {
      console.error('Error cancelling prescription:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-[var(--text-secondary)]">Loading prescriptions...</div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-secondary)]">No prescriptions found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low border-b border-surface-container">
          <tr>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold">Prescription ID</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold">Patient Name</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold">Doctor Name</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-center">Items</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-center">Status</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {prescriptions.map((prescription) => (
            <tr 
              key={prescription.id} 
              className="hover:bg-[var(--background)] transition-colors"
            >
              <td className="px-6 py-4">
                <span className="font-medium text-[var(--text-primary)] text-xs bg-slate-100 px-2 py-1 rounded">
                  {formatRxNumber(prescription.prescriptionNumber, prescription.id, prescription.createdAt, hospitalName)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold uppercase">
                    {prescription.patientName?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-label-md text-on-surface leading-tight">{prescription.patientName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{prescription.patientCode || 'N/A'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                {prescription.doctorName}
              </td>
              <td className="px-6 py-4 text-center">
                 <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase">
                   {prescription.itemCount} Meds
                 </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                  prescription.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                  prescription.status === 'DISPENSED' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {prescription.status || 'PENDING'}
                </span>
              </td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                {prescription.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleCancel(prescription.id)}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Cancel
                    </button>
                    <Link 
                      href={`/pharmacy/sales?prescriptionId=${prescription.id}`}
                      className="px-4 py-2 bg-orange-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">payments</span>
                      Dispense
                    </Link>
                  </>
                )}
                {prescription.status === 'DISPENSED' && (
                  <Link 
                    href={`/pharmacy/sales/prescription/${prescription.id}`}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View Bill
                  </Link>
                )}
                {prescription.status !== 'PENDING' && prescription.status !== 'DISPENSED' && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">No Actions</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionTable;
