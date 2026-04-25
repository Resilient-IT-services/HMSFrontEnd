'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { HospitalResponse } from '@/types/api';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await hospitalService.list(page, 20, searchTerm, statusFilter);
      if (res.success && res.data) {
        setHospitals(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm, statusFilter]);

  const totalPages = Math.ceil(totalElements / 20);

  return (
    <MainLayout title="Hospital Management">
      <div className="max-w-7xl mx-auto">
        {/* Page Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-headline-xl text-[var(--on-surface)]">Hospital Network</h2>
            <p className="font-body-md text-[var(--on-surface-variant)]">Manage and monitor all healthcare facilities within the VitalSync ecosystem.</p>
          </div>
          <Link 
            href="/super_admin/hospitals/create"
            className="bg-[var(--primary)] hover:opacity-90 text-white font-bold px-6 py-3 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Add Hospital
          </Link>
        </div>

        {/* Stats Overview (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <span className="material-symbols-outlined">local_hospital</span>
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+2 this month</span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Hospitals</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--on-surface)]">{hospitals.length}</h3>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <span className="material-symbols-outlined">person</span>
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Users</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--on-surface)]">1,482</h3>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-green-50 text-green-600 rounded-lg">
                <span className="material-symbols-outlined">check_circle</span>
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operational Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--on-surface)]">98.4%</h3>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <span className="material-symbols-outlined">analytics</span>
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg. Patient Load</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--on-surface)]">82%</h3>
          </div>
        </div>

        {/* Hospital Table Container */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex gap-2">
              <button 
                onClick={() => setStatusFilter(undefined)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm ${!statusFilter ? 'bg-white border border-gray-200' : 'text-gray-500 hover:bg-white hover:border-gray-200'}`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm ${statusFilter === 'ACTIVE' ? 'bg-white border border-gray-200' : 'text-gray-500 hover:bg-white hover:border-gray-200'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter('MAINTENANCE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm ${statusFilter === 'MAINTENANCE' ? 'bg-white border border-gray-200' : 'text-gray-500 hover:bg-white hover:border-gray-200'}`}
              >
                Maintenance
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none w-full md:w-64" 
                placeholder="Search hospital name or code..." 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Hospital Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Total Users</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading hospitals...</td>
                  </tr>
                ) : hospitals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No hospitals found.</td>
                  </tr>
                ) : hospitals.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {row.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{row.name}</div>
                          <div className="text-xs text-gray-500">ID: {row.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{row.address || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${row.status === 'ACTIVE' ? 'bg-green-600' : 'bg-amber-500'}`}></span>
                        {row.status === 'ACTIVE' ? 'Active' : 'Maintenance'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[var(--primary)] h-1.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-xs font-medium text-gray-700">128</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-[var(--primary)] transition-colors" title="View Users">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button 
                          onClick={() => router.push(`/super_admin/hospitals/${row.id}`)}
                          className="p-2 text-gray-400 hover:text-[var(--primary)] transition-colors" 
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-bold">
              Showing {page * 20 + 1} to {Math.min((page + 1) * 20, totalElements)} of {totalElements} hospitals
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-xs font-bold border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) >= totalPages}
                className="px-3 py-1 text-xs font-bold border border-gray-200 rounded bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Featured Card / Information Banner */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-xl bg-[var(--primary)] text-white p-8 h-48 flex flex-col justify-end">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[120px]">health_and_safety</span>
            </div>
            <h4 className="text-xl font-bold mb-2">Hospital Network Expansion</h4>
            <p className="text-sm opacity-90 max-w-sm mb-4">Adding new facilities requires verification of medical licenses and local compliance standards.</p>
            <a className="inline-flex items-center text-xs font-bold uppercase tracking-widest hover:underline" href="#">
              View Documentation <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
            </a>
          </div>
          <div className="bg-white border border-gray-200 p-8 rounded-xl flex items-center gap-6">
            <img 
              alt="Hospital Entrance" 
              className="w-32 h-32 rounded-lg object-cover shadow-sm" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRyE_sDhFWi_725ww6E2HsHRm2ZLcvF-o1ACpNpzzrFoCpBBfXws3gMfXsHH8bwG8z5BV_sFVFL4uZ2Gl8TMgQDkexi6ntlouCr9QASKoMHBJGefw64PKMCONwrIkOkNvyeHecby2GBiYRIi7tkgzHtKcxJE49AqSv-15uGsF8BszNHThKVbzUtYfmnZPj22jsw9l4EgMzkmzrVzqhWiBsbYr1upFyimdEq5eAAxRhNggkCcEhfm3ouLTU1BXnHvDpsFeFejhOxnU"
            />
            <div>
              <h4 className="text-lg font-bold mb-1 text-[var(--text-primary)]">Onboarding Support</h4>
              <p className="text-sm text-gray-500 mb-4">Need help setting up a new hospital branch? Our support team is available 24/7 for administrative guidance.</p>
              <button className="text-[var(--primary)] text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-colors">Contact Support</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}