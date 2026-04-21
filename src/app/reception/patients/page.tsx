'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { patientService } from '@/services/patientService';
import { PatientResponse, ApiResponse, PageResponse } from '@/types/api';
import { Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { PatientRegistrationModal } from '@/components/reception/PatientRegistrationModal';
import { useDebounce } from '@/hooks/useDebounce';

const PatientsPage = () => {
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.list(page, 20, debouncedSearchTerm);
      if (response.success && response.data) {
        setPatients(response.data.content);
        setTotalElements(response.data.totalElements);
      }
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm]);

  const columns = [
// ... existing columns ...
    { 
      header: 'Patient ID', 
      accessor: (row: PatientResponse) => (
        <span className="font-mono text-sm text-[var(--primary)] font-bold">#PAT-{row.id.toString().padStart(5, '0')}</span>
      )
    },
    { 
      header: 'Patient Name', 
      accessor: (row: PatientResponse) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-bold text-xs uppercase">
            {row.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{row.fullName}</span>
            <span className="text-xs text-[var(--text-secondary)]">{row.phone}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Gender', 
      accessor: (row: PatientResponse) => (
        <span className="text-sm capitalize">{row.gender.toLowerCase()}</span>
      )
    },
    { 
      header: 'Status', 
      accessor: () => (
        <span className="px-2 py-1 bg-[var(--success-light)] text-[var(--success)] text-[10px] font-black uppercase rounded">Out-patient</span>
      )
    },
    { 
      header: 'Created At', 
      accessor: (row: PatientResponse) => (
        <span className="text-sm text-[var(--text-secondary)]">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: PatientResponse) => (
        <div className="flex justify-end gap-2">
          <Link href={`/reception/patients/${row.id}`} className="text-xs font-bold text-[var(--primary)] hover:underline">View Profile</Link>
          <Link 
            href={`/reception/appointments/create?patientId=${row.id}`}
            className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-3 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all"
          >
            Book Appt
          </Link>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Patient Directory">
      <div className="space-y-6">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                <Search className="size-5" />
              </span>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                placeholder="Search by Name, Patient ID, or Phone Number..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select className="bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:ring-[var(--primary)] outline-none">
                <option>Active Status</option>
                <option>In-Patient</option>
                <option>Out-Patient</option>
                <option>Discharged</option>
              </select>
              <button 
                onClick={() => setShowRegModal(true)}
                className="bg-[var(--primary-light)] text-[var(--primary)] p-3 rounded-xl hover:bg-[var(--primary)] hover:text-white transition-colors"
                title="Add New Patient"
              >
                <UserPlus className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <Card>
          <Table columns={columns} data={patients} isLoading={loading} />
          
          <div className="bg-[var(--background)] border-t border-[var(--border)] px-6 py-4 flex items-center justify-between mt-4">
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Showing {patients.length} of {totalElements} patients
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border border-[var(--border)] rounded text-xs font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-[var(--primary)] text-white rounded text-xs font-bold">{page + 1}</button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={patients.length < 20}
                className="px-3 py-1 border border-[var(--border)] rounded text-xs font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </Card>

        {/* Stats Summary from HTML */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-[var(--primary-light)] border border-[var(--primary)]/20 p-5 rounded-xl flex items-center gap-4">
            <div className="size-12 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Total Patients</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{totalElements}</p>
            </div>
          </div>
          <div className="bg-[var(--success-light)] border border-[var(--success)]/20 p-5 rounded-xl flex items-center gap-4">
            <div className="size-12 rounded-lg bg-[var(--success)] flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--success)] uppercase tracking-widest">New Today</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">--</p>
            </div>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-xl flex items-center gap-4">
            <div className="size-12 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Appointments</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">--</p>
            </div>
          </div>
        </div>
      </div>

      <PatientRegistrationModal 
        isOpen={showRegModal} 
        onClose={() => setShowRegModal(false)} 
        onSuccess={fetchPatients}
      />
    </MainLayout>
  );
};

export default PatientsPage;
