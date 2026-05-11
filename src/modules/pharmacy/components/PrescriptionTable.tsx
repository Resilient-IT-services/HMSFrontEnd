import React from 'react';
import { PrescriptionSummaryDTO } from '@/types/api';
import StatusBadge from './StatusBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PrescriptionTableProps {
  prescriptions: PrescriptionSummaryDTO[];
  loading?: boolean;
}

const PrescriptionTable: React.FC<PrescriptionTableProps> = ({ prescriptions, loading }) => {
  const router = useRouter();

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
              className="hover:bg-[var(--background)] transition-colors cursor-pointer"
              onDoubleClick={() => router.push(`/pharmacy/prescriptions/${prescription.id}`)}
            >
              <td className="px-6 py-4">
                <span className="font-medium text-[var(--text-primary)] text-xs bg-slate-100 px-2 py-1 rounded">
                  #{prescription.id.substring(0, 8).toUpperCase()}
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
