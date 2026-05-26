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
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchPrescriptions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getPrescriptionsSummary({ search: debouncedSearch });
      if (response.success && response.data) {
        // Filter out prescriptions that are already completed or dispensed
        const activePrescriptions = response.data.content.filter(
          rx => rx.status !== 'COMPLETED' && rx.status !== 'DISPENSED'
        );
        setPrescriptions(activePrescriptions);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const trigger = async () => {
      await fetchPrescriptions();
    };
    void trigger();
  }, [fetchPrescriptions]);

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
              href="/pharmacy/sales"
              className="flex items-center px-6 py-3.5 bg-orange-700 text-white font-bold rounded-xl hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20 active:scale-95"
            >
              <span className="material-symbols-outlined mr-2 text-xl">point_of_sale</span>
              Walk-in Billing
            </Link>
          </PageHeading>

          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
                <input 
                  className="w-full rounded-xl border-[var(--border)] bg-[var(--background)] py-3.5 pl-12 pr-4 focus:ring-[var(--primary)] text-[var(--text-primary)] outline-none" 
                  placeholder="Search by patient name, Rx ID, or doctor..." 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
              <PrescriptionTable prescriptions={prescriptions} />
            )}
          </section>
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default PrescriptionListPage;
