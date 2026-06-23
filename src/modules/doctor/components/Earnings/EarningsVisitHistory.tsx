'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentResponse } from '@/types/api';

interface EarningsVisitHistoryProps {
  loading: boolean;
  filteredAppointments: AppointmentResponse[];
  consultationFee: number;
  statusCaptions: Record<string, string>;
}

export const EarningsVisitHistory: React.FC<EarningsVisitHistoryProps> = ({
  loading,
  filteredAppointments,
  consultationFee,
  statusCaptions,
}) => {
  const getBadgeVariant = (status: string): 'emerald' | 'red' | 'slate' | 'orange' | 'blue' => {
    switch (status) {
      case 'COMPLETED': { return 'emerald'; }
      case 'CANCELLED': { return 'red'; }
      case 'CONSULTATION_STARTED': { return 'blue'; }
      case 'SCHEDULED': { return 'orange'; }
      default: { return 'slate'; }
    }
  };

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Date & Time',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-900">
            {new Date(row.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )
    },
    {
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center justify-center text-center">
          <p className="text-sm font-bold text-slate-900 leading-none">{row.patientName}</p>
        </div>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => (
        <Badge variant={getBadgeVariant(row.status)}>
          {statusCaptions[row.status] || row.status}
        </Badge>
      )
    },
    {
      header: 'Earning',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => {
        const isEarned = row.status !== 'CANCELLED' && row.status !== 'PAYMENT_PENDING';
        return (
          <div className="flex flex-col items-end">
            <span className={`text-sm font-bold ${isEarned ? 'text-slate-900' : 'text-slate-300'}`}>
              ₹{isEarned ? consultationFee.toLocaleString() : '0'}
            </span>
            {isEarned && (
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Verified</span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <Table 
      columns={columns} 
      data={filteredAppointments} 
      isLoading={loading}
      emptyMessage={
        <div className="flex flex-col items-center gap-2 opacity-30 py-12">
          <span className="material-symbols-outlined text-4xl">payments</span>
          <p className="text-xs font-bold uppercase tracking-widest">No encounters found</p>
        </div>
      }
    />
  );
};
