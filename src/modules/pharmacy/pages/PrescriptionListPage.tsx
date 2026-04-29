'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionDTO } from '@/types/api';
import PrescriptionTable from '../components/PrescriptionTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const PrescriptionListPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await pharmacyApi.getPrescriptions({ search: searchTerm });
      if (response.success && response.data) {
        setPrescriptions(response.data.content);
      } else {
        setError(response.message || 'Failed to fetch prescriptions');
      }
    } catch (error_) {
      setError('An unexpected error occurred');
      console.error(error_);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Prescriptions</h1>
          <p className="text-[var(--text-secondary)]">Manage and dispense patient prescriptions</p>
        </div>
      </div>

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
  );
};

export default PrescriptionListPage;
