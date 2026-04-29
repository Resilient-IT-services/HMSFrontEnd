'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { pharmacyService } from '@/services/pharmacyService';
import { PrescriptionResponse } from '@/types/api';
import Link from 'next/link';

const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [prescriptionResponse, lowStockResponse] = await Promise.allSettled([
          pharmacyService.listPrescriptions(),
          pharmacyService.getLowStockCount(),
        ]);

        if (prescriptionResponse.status === 'fulfilled') {
          const res = prescriptionResponse.value;
          if (res.success && res.data && Array.isArray(res.data.content)) {
            setPrescriptions(res.data.content);
          } else {
            console.error('Pharmacy Dashboard - Prescriptions API returned unsuccessful or invalid data:', res);
            setPrescriptions([]);
          }
        } else {
          console.error('Pharmacy Dashboard - Prescriptions API request failed:', prescriptionResponse.reason);
          setPrescriptions([]);
        }

        if (lowStockResponse.status === 'fulfilled') {
          const res = lowStockResponse.value;
          if (res.success && res.data && typeof res.data.totalElements === 'number') {
            setLowStockCount(res.data.totalElements);
          } else {
            console.error('Pharmacy Dashboard - Low Stock API returned unsuccessful or invalid data:', res);
            setLowStockCount(0);
          }
        } else {
          console.error('Pharmacy Dashboard - Low Stock API request failed:', lowStockResponse.reason);
          setLowStockCount(0);
        }
      } catch (error) {
        console.error('Pharmacy Dashboard - Unexpected Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    // Ensure prescriptions is an array before processing
    const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];
    
    const pendingPrescriptions = safePrescriptions.filter((prescription) => 
      prescription && prescription.status !== 'COMPLETED'
    ).length;
    
    const dispensedToday = safePrescriptions.filter((prescription) => 
      prescription && prescription.status === 'COMPLETED'
    ).length;
    
    let queuedItems = 0;
    for (const prescription of safePrescriptions) {
      const itemsCount = Array.isArray(prescription?.items) ? prescription.items.length : 0;
      queuedItems += itemsCount;
    }

    return {
      pendingPrescriptions,
      dispensedToday,
      queuedItems,
      lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : 0,
    };
  }, [lowStockCount, prescriptions]);

  return (
    <MainLayout title="Pharmacy Overview">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Pending Prescriptions</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.pendingPrescriptions}</h3>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--success-light)] p-2 text-[var(--success)]">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Filled Today</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.dispensedToday}</h3>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--warning-light)] p-2 text-[var(--warning)]">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Low Stock Alerts</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.lowStockCount}</h3>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--primary-light)] p-2 text-[var(--primary)]">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-2 py-1 rounded-full">Live</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Items in Queue</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.queuedItems}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Prescription Queue</h2>
              <button className="text-sm font-semibold text-[var(--primary)]">Advanced Search</button>
            </div>
            <div className="mb-6 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
              <input className="w-full rounded-xl border-[var(--border)] bg-[var(--background)] py-3.5 pl-12 pr-4 focus:ring-[var(--primary)] text-[var(--text-primary)]" placeholder="Search by patient name or Rx ID..." type="text" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-4 font-semibold text-[var(--text-secondary)] text-sm uppercase">Patient</th>
                    <th className="pb-4 font-semibold text-[var(--text-secondary)] text-sm uppercase">Doctor</th>
                    <th className="pb-4 font-semibold text-[var(--text-secondary)] text-sm uppercase text-center">Items</th>
                    <th className="pb-4 font-semibold text-[var(--text-secondary)] text-sm uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">Loading...</td></tr>
                  ) : (Array.isArray(prescriptions) && prescriptions.length > 0) ? prescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-[var(--background)] transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-[var(--text-primary)]">{prescription.patientName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">ID: #RX-{prescription.id}</p>
                      </td>
                      <td className="py-4 text-sm font-medium text-[var(--text-primary)]">{prescription.doctorName}</td>
                      <td className="py-4 text-center">
                        <span className="rounded-full bg-[var(--primary-light)] px-2 py-1 text-xs font-bold text-[var(--primary)]">{prescription.items?.length || 0} items</span>
                      </td>
                      <td className="py-4 text-right">
                        <Link href={`/pharmacy/prescriptions/${prescription.id}`} className="text-[var(--primary)] hover:underline text-sm font-bold">Process Bill</Link>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">No prescriptions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Operational Summary</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-2 border-[var(--primary)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Pending prescriptions</p>
                  <p className="text-xs text-[var(--text-secondary)]">{stats.pendingPrescriptions} records are waiting to be dispensed.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-l-2 border-[var(--border)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Completed prescriptions</p>
                  <p className="text-xs text-[var(--text-secondary)]">{stats.dispensedToday} records are already marked as completed.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Queue Snapshot</h2>
            <div className="h-48 w-full flex items-end gap-2 px-2">
              {[stats.pendingPrescriptions, stats.dispensedToday, stats.lowStockCount, stats.queuedItems].map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"
                  style={{ height: `${Math.max(20, Math.min(100, value * 10 || 20))}%` }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Inventory Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Low stock medicines</p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">{stats.lowStockCount} inventory records currently need attention.</p>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{stats.lowStockCount}</span>
              </div>
              <button className="w-full mt-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] py-2 text-sm font-bold hover:bg-[var(--primary)] hover:text-white transition-all">Review Stock Queue</button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PharmacyDashboard;
