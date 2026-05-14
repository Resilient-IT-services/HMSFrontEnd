'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionSummaryDTO } from '@/types/api';
import PrescriptionTable from '../components/PrescriptionTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

import MainLayout from '@/components/ui/MainLayout';

const PrescriptionListPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getPrescriptionsSummary({ search: debouncedSearch });
      if (response.success && response.data) {
        setPrescriptions(response.data.content);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch (error_) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [debouncedSearch]);

  return (
    <MainLayout title="Prescriptions">
      <div className="space-y-6">
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
            <button className="flex items-center px-6 py-3.5 bg-white border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--background)] transition-colors">
              <span className="material-symbols-outlined mr-2">filter_list</span>
              Filters
            </button>
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
    </MainLayout>
  );
};

export default PrescriptionListPage;
