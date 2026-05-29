'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionSummaryDTO } from '@/types/api';
import PrescriptionTable from '../components/PrescriptionTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

import MainLayout from '@/components/ui/MainLayout';
import Link from 'next/link';

import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

const PrescriptionListPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>('PENDING');
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchPrescriptions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getPrescriptionsSummary({
        search: debouncedSearch,
        status: showHistory ? (statusFilter === 'ALL' ? undefined : statusFilter) : 'PENDING'
      });
      if (response.success && response.data) {
        setPrescriptions(response.data.content);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, showHistory, statusFilter]);

  useEffect(() => {
    const trigger = async () => {
      await fetchPrescriptions();
    };
    void trigger();
  }, [fetchPrescriptions]);

  const handleHistoryToggle = (checked: boolean) => {
    setShowHistory(checked);
    if (checked) {
      setStatusFilter('ALL');
    } else {
      setStatusFilter('PENDING');
    }
  };

  return (
      <MainLayout title="Prescription Queue" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#f8f9fb]"
            fontClassName="font-inter"
        >
          <div className="space-y-8 py-4 md:py-8">
            <PageHeading
                title="Prescription Queue"
                description="Access and process incoming digital prescriptions from doctors."
            >
              <Link
                  href="/pharmacy/billing"
                  className="flex items-center px-6 py-3.5 bg-orange-700 text-white font-bold rounded-xl hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20 active:scale-95"
              >
                <span className="material-symbols-outlined mr-2 text-xl">point_of_sale</span>
                Walk-in Billing
              </Link>
            </PageHeading>

            <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
                    <input
                        className="w-full rounded-xl border-[var(--border)] bg-[var(--background)] py-3.5 pl-12 pr-4 focus:ring-[var(--primary)] text-[var(--text-primary)] outline-none"
                        placeholder="Search by patient name, Rx ID, or doctor..."
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 px-2 py-2 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                        type="checkbox"
                        id="showHistory"
                        checked={showHistory}
                        onChange={(e) => handleHistoryToggle(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="showHistory" className="text-xs font-black uppercase text-slate-600 cursor-pointer select-none">Show History</label>
                  </div>
                </div>

                {showHistory && (
                    <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit animate-in fade-in slide-in-from-top-2 duration-200">
                      {[
                        { label: 'All', value: 'ALL' },
                        { label: 'Pending', value: 'PENDING' },
                        { label: 'Completed', value: 'DISPENSED' },
                        { label: 'Cancelled', value: 'CANCELLED' }
                      ].map((filter) => (
                          <button
                              key={filter.value}
                              onClick={() => setStatusFilter(filter.value)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                  statusFilter === filter.value
                                      ? 'bg-white shadow-sm text-orange-700'
                                      : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                            {filter.label}
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl"></div>
                    ))}
                  </div>
              ) : error ? (
                  <EmptyState message={error} icon="error" />
              ) : (
                  <PrescriptionTable prescriptions={prescriptions} onRefresh={fetchPrescriptions} />
              )}
            </section>
          </div>
        </PageSurface>
      </MainLayout>
  );
};

export default PrescriptionListPage;