'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import apiClient from '@/services/apiClient';
import { ApiResponse, PrescriptionResponse } from '@/types/api';

const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBills: 0,
    dispensedToday: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<{ content: PrescriptionResponse[] }>>('/pharmacy/prescriptions');
        if (response.data.success) {
          const content = response.data.data?.content || [];
          setPrescriptions(content);
          setStats(prev => ({
            ...prev,
            pendingBills: content.filter(p => p.status === 'PENDING').length,
          }));
        }

        const stockRes = await apiClient.get<ApiResponse<{ totalElements: number }>>('/pharmacy/stock?lowStock=true');
        if (stockRes.data.success) {
          setStats(prev => ({
            ...prev,
            lowStock: stockRes.data.data?.totalElements || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch pharmacy data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  return (
    <MainLayout title="Pharmacy Overview">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="text-xs font-bold text-[var(--success)] bg-[var(--success-light)] px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Pending Prescriptions</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.pendingBills}</h3>
        </div>
        
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--success-light)] p-2 text-[var(--success)]">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-secondary)] bg-[var(--background)] px-2 py-1 rounded-full">-5%</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Filled Today</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">142</h3>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--warning-light)] p-2 text-[var(--warning)]">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-xs font-bold text-[var(--error)] bg-[var(--error-light)] px-2 py-1 rounded-full">8 Critical</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Low Stock Alerts</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stats.lowStock}</h3>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--primary)]/30 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="rounded-xl bg-[var(--primary-light)] p-2 text-[var(--primary)]">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-xs font-bold text-[var(--success)] bg-[var(--success-light)] px-2 py-1 rounded-full">+18%</span>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Daily Sales</p>
          <h3 className="text-3xl font-bold text-[var(--text-primary)] mt-1">₹45,280</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Medication Finder / Table */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Prescription Queue</h2>
              <button className="text-sm font-semibold text-[var(--primary)]">Advanced Search</button>
            </div>
            <div className="mb-6 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
              <input className="w-full rounded-xl border-[var(--border)] bg-[var(--background)] py-3.5 pl-12 pr-4 focus:ring-[var(--primary)] text-[var(--text-primary)]" placeholder="Search by patient name or Rx ID..." type="text"/>
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
                  ) : prescriptions.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--background)] transition-colors">
                      <td className="py-4">
                        <p className="font-bold text-[var(--text-primary)]">{p.patientName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">ID: #RX-{p.id}</p>
                      </td>
                      <td className="py-4 text-sm font-medium text-[var(--text-primary)]">{p.doctorName}</td>
                      <td className="py-4 text-center">
                        <span className="rounded-full bg-[var(--primary-light)] px-2 py-1 text-xs font-bold text-[var(--primary)]">{p.items.length} items</span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-[var(--primary)] hover:underline text-sm font-bold">Process Bill</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Recent Pharmacy Activity</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-l-2 border-[var(--primary)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Order #RX-92843 Filled</p>
                  <p className="text-xs text-[var(--text-secondary)]">Patient: Amit Sharma • 3 items • ₹1,240</p>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">12 mins ago</span>
              </div>
              <div className="flex items-center gap-4 border-l-2 border-[var(--border)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Inventory Restock: Insulin Glargine</p>
                  <p className="text-xs text-[var(--text-secondary)]">Supplier: Pharmalink Logistics • 100 units</p>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">45 mins ago</span>
              </div>
            </div>
          </section>
        </div>

        {/* Side Panels */}
        <div className="space-y-8">
          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Weekly Sales Trend</h2>
            <div className="h-48 w-full flex items-end gap-2 px-2">
              <div className="h-[40%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[65%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[55%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[80%] flex-1 rounded-t-lg bg-[var(--primary)]/20 hover:bg-[var(--primary)] transition-all"></div>
              <div className="h-[95%] flex-1 rounded-t-lg bg-[var(--primary)] transition-all"></div>
            </div>
          </section>

          <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-sm">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Expiring Soon</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Ibuprofen 400mg</p>
                  <p className="text-xs text-[var(--error)] font-medium">Expires: 15 Nov 2024</p>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)]">150 units</span>
              </div>
              <button className="w-full mt-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] py-2 text-sm font-bold hover:bg-[var(--primary)] hover:text-white transition-all">Resolve Alerts</button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PharmacyDashboard;
