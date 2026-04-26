'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { patientService } from '@/services/patientService';
import { PatientResponse } from '@/types/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

const PatientsPage = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

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

  return (
    <MainLayout title="Patient Directory" hideTitle>
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-manrope text-3xl font-black text-slate-900 tracking-tight uppercase">Patient Directory</h2>
            <p className="text-slate-500 font-medium mt-1">Access and manage comprehensive electronic health records.</p>
          </div>
          <Link href="/reception/patients/create">
            <button className="bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-600/20">
              <span className="material-symbols-outlined">person_add</span>
              Register New Patient
            </button>
          </Link>
        </div>

        {/* Stats & Search Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           {/* Metric Cards */}
           <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Records', val: totalElements, color: 'text-slate-600', bg: 'bg-slate-100', icon: 'group' },
                { label: 'New Today', val: '04', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'how_to_reg' },
                { label: 'In-Patient', val: '12', color: 'text-blue-600', bg: 'bg-blue-50', icon: 'bed' },
                { label: 'Emergency', val: '02', color: 'text-orange-600', bg: 'bg-orange-50', icon: 'emergency' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                  <div className={`p-2 ${s.bg} ${s.color} rounded-lg mb-2`}>
                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-slate-900">{s.val}</p>
                </div>
              ))}
           </div>

           {/* Search Box */}
           <div className="lg:col-span-5">
             <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm h-full flex items-center">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-600/20 transition-all font-bold text-sm outline-none" 
                    placeholder="Search by name, ID, or phone..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
           </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Patient Profile</th>
                  <th className="px-6 py-4 text-center">Gender</th>
                  <th className="px-6 py-4 text-center">Category</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">Retrieving electronic health records...</td></tr>
                ) : (patients.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium">No patient records found.</td></tr>
                ) : patients.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onDoubleClick={() => router.push(`/reception/patients/${row.id}`)}
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
                        #PAT-{row.id.toString().slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border-2 border-white shadow-sm">
                          {row.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-xs text-slate-600 capitalize">
                      {row.gender.toLowerCase()}
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100">
                         Out-Patient
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/reception/appointments/create?patientId=${row.id}`}
                          className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                        >
                          Book Visit
                        </Link>
                        <button 
                          onClick={() => router.push(`/reception/patients/${row.id}`)}
                          className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{page * 20 + 1}-{Math.min((page + 1) * 20, totalElements)}</span> of {totalElements} patients
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="px-4 py-2 bg-white text-orange-700 border border-orange-200 rounded-lg text-xs font-black shadow-sm">{page + 1}</button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * 20 >= totalElements}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientsPage;
