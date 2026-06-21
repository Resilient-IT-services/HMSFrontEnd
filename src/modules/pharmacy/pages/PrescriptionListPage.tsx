'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionSummaryDTO } from '@/types/api';
import EmptyState from '../components/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { SearchInput } from '@/components/ui/SearchInput';
import { useCallback } from 'react';
import { formatRxNumber } from '@/utils/formatters';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

const PrescriptionListPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const hospitalName = user?.memberships?.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName;
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedColumnFilters = useDebounce(columnFilters, 500);

  const fetchPrescriptions = useCallback(async (forceLoading = false) => {
    try {
      if (forceLoading) setLoading(true);
      
      const term = debouncedSearch.trim();
      const apiSearch = term.startsWith('#') ? term.substring(1) : term;

      const response = await pharmacyApi.getPrescriptionsSummary({
        search: apiSearch || undefined,
        status: showHistory ? undefined : 'PENDING',
        sort,
        ...debouncedColumnFilters
      });
      if (response.success && response.data) {
        // Filter out prescriptions with 0 items as a safeguard
        const filteredContent = response.data.content.filter(p => (p.itemCount || 0) > 0);
        setPrescriptions(filteredContent);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch (error) {
      console.error('Fetch prescriptions error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showHistory, debouncedColumnFilters, sort]);

  const filteredPrescriptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return prescriptions;
    
    const cleanTerm = term.startsWith('#') ? term.substring(1) : term;

    return prescriptions.filter(p => {
      const rxDisplay = formatRxNumber(p.prescriptionNumber, p.id, p.createdAt, hospitalName).toLowerCase();
      return (
        p.patientName?.toLowerCase().includes(term) ||
        rxDisplay.includes(cleanTerm) ||
        p.doctorName?.toLowerCase().includes(term) ||
        p.patientCode?.toLowerCase().includes(term)
      );
    });
  }, [prescriptions, searchTerm]);

  useEffect(() => {
    const trigger = async () => {
      await fetchPrescriptions(false);
    };
    void trigger();
  }, [fetchPrescriptions]);

  const handleCancel = useCallback(async (id: string) => {
    if (!globalThis.confirm('Are you sure you want to cancel this prescription? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await pharmacyApi.cancelPrescription(id);
      if (response.success) {
        void fetchPrescriptions(true);
      } else {
        alert(response.message || 'Failed to cancel prescription');
      }
    } catch (error: any) {
      console.error('Error cancelling prescription:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      alert(`Error: ${errorMessage}`);
    }
  }, [fetchPrescriptions]);

  const columns: Column<PrescriptionSummaryDTO>[] = useMemo(() => [
    {
      header: 'Prescription ID',
      width: '160px',
      render: (p) => (
        <span className="font-medium text-[var(--text-primary)] text-xs bg-slate-100 px-2 py-1 rounded">
          {formatRxNumber(p.prescriptionNumber, p.id, p.createdAt, hospitalName)}
        </span>
      )
    },
    {
      header: 'Patient Name',
      width: '220px',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold uppercase">
            {p.patientName?.charAt(0) || 'P'}
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-tight">{p.patientName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.patientCode || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Doctor',
      render: (p) => <span className="text-sm font-medium text-slate-700">{p.doctorName}</span>
    },
    {
      header: 'Items',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (p) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase">
          {p.itemCount} Meds
        </span>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (p) => {
        const variants: Record<string, any> = {
          PENDING: 'orange',
          DISPENSED: 'emerald',
          CANCELLED: 'red'
        };
        return <Badge variant={variants[p.status || 'PENDING'] || 'slate'}>{p.status || 'PENDING'}</Badge>;
      }
    },
    {
      header: 'Actions',
      className: 'text-center',
      headerClassName: 'text-center',
      width: '200px',
      render: (p) => (
        <div className="flex items-center justify-center gap-2">
          {p.status === 'PENDING' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon="cancel"
                className="text-red-600 border-red-100 hover:bg-red-50"
                onClick={() => handleCancel(p.id)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                icon="payments"
                href={`/pharmacy/sales?prescriptionId=${p.id}`}
                className="bg-orange-700 hover:bg-orange-800"
              >
                Dispense
              </Button>
            </>
          )}
          {p.status === 'DISPENSED' && (
            <Button
              variant="secondary"
              size="sm"
              icon="visibility"
              href={`/pharmacy/sales/prescription/${p.id}`}
            >
              View Bill
            </Button>
          )}
        </div>
      )
    }
  ], [handleCancel]);

  return (
    <MainLayout title="Prescription Queue" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-4 py-2 md:py-4">
          <PageHeading
            title="Prescription Queue"
            description="Access and process incoming digital prescriptions from doctors."
          >
            {/*<Button icon="point_of_sale" className="bg-orange-700" href="/pharmacy/billing">*/}
            {/*  Walk-in Billing*/}
            {/*</Button>*/}
          </PageHeading>

          <ContentPanel
            toolbar={(
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <div className="relative flex-1 w-full max-w-xl">
                  <SearchInput
                    placeholder="Search by patient name, Rx ID, or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <input
                      type="checkbox"
                      id="showHistory"
                      checked={showHistory}
                      onChange={(e) => setShowHistory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="showHistory" className="text-xs font-black uppercase text-slate-600 cursor-pointer select-none">Show History</label>
                  </div>
                  <Button variant="secondary" icon="refresh" isLoading={loading} onClick={() => fetchPrescriptions()} />
                </div>
              </div>
            )}
          >
            {error ? (
              <EmptyState message={error} icon="error" />
            ) : (
              <Table
                columns={columns}
                data={filteredPrescriptions}
                isLoading={loading}
                emptyMessage="No prescriptions found in the queue."
                onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                activeFilters={columnFilters}
                onSort={(key, dir) => setSort(dir ? `${key},${dir}` : undefined)}
              />
            )}
          </ContentPanel>
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default PrescriptionListPage;