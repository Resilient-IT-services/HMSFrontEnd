import React from 'react';
import { PrescriptionDTO } from '@/types/api';
import StatusBadge from './StatusBadge';
import Link from 'next/link';

interface PrescriptionTableProps {
  prescriptions: PrescriptionDTO[];
  loading?: boolean;
}

const PrescriptionTable: React.FC<PrescriptionTableProps> = ({ prescriptions, loading }) => {
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
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-center">Date</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-center">Status</th>
            <th className="px-6 py-4 text-label-sm text-secondary uppercase font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {prescriptions.map((prescription) => (
            <tr key={prescription.id} className="hover:bg-[var(--background)] transition-colors">
              <td className="px-6 py-4">
                <span className="font-medium text-[var(--text-primary)]">#RX-{prescription.id}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-xs font-bold">
                    {prescription.patientName?.charAt(0) || 'P'}
                  </div>
                  <span className="font-label-md text-on-surface">{prescription.patientName}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                {prescription.doctorName}
              </td>
              <td className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                {prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 text-center">
                <StatusBadge status={prescription.status || 'PENDING'} />
              </td>
              <td className="px-6 py-4 text-right">
                <Link 
                  href={`/pharmacy/prescriptions/${prescription.id}`}
                  className="text-[var(--primary)] hover:underline text-sm font-bold"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionTable;
