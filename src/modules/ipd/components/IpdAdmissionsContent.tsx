'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { useIpd } from '@/modules/ipd/hooks/useIpd';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDateTime } from '@/utils/formatters';
import { AdmissionResponseDTO, AdmissionStatus } from '@/types/ipd';
import { ADMISSION_STATUS_OPTIONS } from '@/utils/enumOptions';
import { Pagination } from '@/components/ui/Pagination';
import AdmitPatientModal from '@/modules/ipd/components/AdmitPatientModal';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/SearchInput';
import dayjs from '@/lib/dayjs';

export type IpdStatusFilter = 'ALL' | 'TODAY' | 'ADMITTED' | 'DISCHARGED';

interface IpdAdmissionsContentProps {
  statusFilter?: IpdStatusFilter;
}

export const IpdAdmissionsContent = ({ statusFilter = 'ALL' }: IpdAdmissionsContentProps) => {
  const router = useRouter();
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const { admissions, loading, fetchAdmissions, updateStatus } = useIpd();
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = isSuperMode || activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';

  useEffect(() => {
    fetchAdmissions(0, 200);
  }, [fetchAdmissions]);

  const getStatusVariant = (status: AdmissionStatus) => {
    switch (status) {
      case 'ADMITTED': { return 'orange'; }
      case 'DISCHARGED': { return 'emerald'; }
      case 'CANCELLED': { return 'red'; }
      default: { return 'slate'; }
    }
  };

  const displayData = useMemo(() => {
    let list = admissions?.content || [];

    // Apply status filter
    switch (statusFilter) {
      case 'TODAY': {
        const todayStart = dayjs().startOf('day');
        list = list.filter(a => dayjs(a.admissionDateTime).isAfter(todayStart));
        break;
      }
      case 'ADMITTED': {
        list = list.filter(a => a.status === 'ADMITTED');
        break;
      }
      case 'DISCHARGED': {
        list = list.filter(a => a.status === 'DISCHARGED');
        break;
      }
      default: { break; }
    }

    // Apply search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a =>
        a.patientName.toLowerCase().includes(q) ||
        (a.admissionNumber?.toLowerCase().includes(q) ?? false)
      );
    }

    return list;
  }, [admissions, statusFilter, searchTerm]);

  const emptyMessage = useMemo(() => {
    if (statusFilter === 'TODAY') return 'No admissions today.';
    if (statusFilter === 'ADMITTED') return 'No currently admitted patients.';
    if (statusFilter === 'DISCHARGED') return 'No discharged patients.';
    return 'No admissions found.';
  }, [statusFilter]);

  const columns: Column<AdmissionResponseDTO>[] = [
    {
      header: 'Admission #',
      key: 'admissionNumber',
      render: (row) => <span className="font-bold text-slate-900">{row.admissionNumber}</span>
    },
    {
      header: 'Patient',
      key: 'patientName',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{row.patientName}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{row.patientId.substring(0, 8)}</span>
        </div>
      )
    },
    {
      header: 'Ward / Bed',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Badge variant="blue" className="rounded-md">{row.wardName}</Badge>
          <span className="font-bold text-slate-700">Bed: {row.bedNumber}</span>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctorName',
      render: (row) => <span className="text-slate-600 font-medium">Dr. {row.doctorName}</span>
    },
    {
      header: 'Admitted At',
      key: 'admissionDateTime',
      render: (row) => <span className="text-slate-500">{formatDateTime(row.admissionDateTime)}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {ADMISSION_STATUS_OPTIONS.find(opt => opt.value === row.status)?.label || row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon="visibility"
            className="h-7 w-7 p-0"
            onClick={() => router.push(`/ipd/admissions/${row.id}`)}
          />
          {row.status === 'ADMITTED' && (
            <Button
              variant="secondary"
              size="sm"
              className="text-[10px] h-7"
              onClick={() => updateStatus(row.id, 'DISCHARGED')}
            >
              Discharge
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="IPD Admissions"
        headerActions={
          isAdmin && (
            <Link href="/settings/wards">
              <Button variant="secondary" icon="settings">Ward Config</Button>
            </Link>
          )
        }
      />

      <div className="mt-6 mb-6 w-full max-w-md">
        <SearchInput
          placeholder="Search admissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <Table
          data={displayData}
          columns={columns}
          isLoading={loading}
          onRowDoubleClick={(row) => router.push(`/ipd/admissions/${row.id}`)}
          emptyMessage={emptyMessage}
        />
        {statusFilter === 'ALL' && admissions && admissions.totalElements > 0 && (
          <Pagination
            page={admissions.page}
            totalElements={admissions.totalElements}
            pageSize={admissions.size}
            onPageChange={(page) => fetchAdmissions(page, 200)}
            label="admissions"
          />
        )}
      </div>

      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onSuccess={() => {
          setIsAdmitModalOpen(false);
          fetchAdmissions(0, 200);
        }}
      />
    </>
  );
};
