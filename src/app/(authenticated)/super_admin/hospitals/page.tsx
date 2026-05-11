'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { HospitalResponse, UserSummaryDTO } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

const HospitalManagement = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showExportButton = false;
  const showStatsCards = false;
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospRes, userRes] = await Promise.all([
          hospitalService.list(page, 20, debouncedSearch, statusFilter === 'ALL' ? undefined : statusFilter),
          userService.listUsers(0, 1) // Only need total count
        ]);

        if (hospRes.success) {
          setHospitals(hospRes.data?.content || []);
          setTotalElements(hospRes.data?.totalElements || 0);
        }
        if (userRes.success) setStaffCount(userRes.data?.totalElements || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedSearch, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalFacilities: totalElements,
      activeBeds: 1842, // Mocked as not in DTO yet
      staffCount: staffCount > 4000 ? staffCount : 4210, // Mocked if small
      revenueGrowth: '12.4%'
    };
  }, [totalElements, staffCount]);

  // Reset page on search or filter change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  return (
    <MainLayout title="Hospital Network" hideTitle>
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f7f9fb] min-h-screen font-inter">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-manrope text-3xl font-bold text-slate-900 uppercase">Hospital Network</h2>
            <p className="text-slate-500 mt-1">Manage and monitor interconnected healthcare facilities across the region.</p>
          </div>
          <button 
            onClick={() => router.push('/super_admin/hospitals/create')}
            className="bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-orange-700/20 hover:opacity-90 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Register New Hospital
          </button>
        </div>
        {/* Stats Grid */}
        {showStatsCards && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Facilities', value: stats.totalFacilities, icon: 'local_hospital', color: 'text-orange-700', bg: 'bg-orange-50', trend: '+2 this month' },
                { label: 'Active Beds', value: stats.activeBeds, icon: 'bed', color: 'text-blue-700', bg: 'bg-blue-50', sub: '84% Occupied' },
                { label: 'Staff Count', value: stats.staffCount, icon: 'medical_services', color: 'text-purple-700', bg: 'bg-purple-50' },
                { label: 'Revenue Growth', value: stats.revenueGrowth, icon: 'monitoring', color: 'text-green-700', bg: 'bg-green-50' }
              ].map((stat, i) => (
                  <div
                      key={i}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start"></div>

                    <div className="mt-4">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        {stat.label}
                      </p>
                      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                        {stat.value}
                      </h3>
                    </div>
                  </div>
              ))}
            </div>
        )}
        {/* Hospital Directory Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input 
                  type="text"
                  placeholder="Search hospitals by name or code..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 relative">
              <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors uppercase tracking-tighter">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Filter
              </button>
              {showFilter && (
                  <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50">

                    {/* Header */}
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                      Filter by Status
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-48 overflow-y-auto">

                      {['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ONBOARDING'].map((status) => (
                          <div
                              key={status}
                              onClick={() => {setStatusFilter(status);setShowFilter(false);}}
                              className={`px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center ${statusFilter === status ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                            {status}
                            {statusFilter === status && (
                                <span className="material-symbols-outlined text-sm">check</span>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
              )}
              {showExportButton && (
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors uppercase tracking-tighter">
                <span className="material-symbols-outlined text-sm">download</span>
                Export
              </button>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {hospitals
              .filter((h) => statusFilter === 'ALL' || h.status === statusFilter)
              .map((h) => (
                <div 
                  key={h.id} 
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/super_admin/hospitals/${h.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold overflow-hidden uppercase">
                        {h.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {h.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${h.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{h.status === 'ACTIVE' ? 'Operational' : h.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">City</p>
                      <p className="text-sm text-slate-600 font-medium">{h.city ?? 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/super_admin/hospitals/${h.id}`);
                        }}
                        className="p-2 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                        title="Edit Facility"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHospital(h);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            {hospitals.length === 0 && !loading && (
              <div className="px-6 py-10 text-center text-slate-400 italic">No hospitals found.</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4 border-b border-slate-100">Hospital Name & ID</th>
                  <th className="px-6 py-4 border-b border-slate-100">city</th>
                  <th className="px-6 py-4 border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {hospitals
                  .filter((h) => statusFilter === 'ALL' || h.status === statusFilter)
                  .map((h) => (
                  <tr 
                    key={h.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onDoubleClick={() => router.push(`/super_admin/hospitals/${h.id}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 font-bold overflow-hidden uppercase">
                          {h.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {h.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                      {h.city ?? 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${h.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{h.status === 'ACTIVE' ? 'Operational' : h.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center gap-2 items-center transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/super_admin/hospitals/${h.id}`);
                          }}
                          className="p-2 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                          title="Edit Facility">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHospital(h);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                            title="View Details">
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {hospitals.length === 0 && !loading && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No hospitals found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-900">{page * 20 + 1}-{Math.min((page + 1) * 20, totalElements)}</span> of {totalElements} facilities
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-black">{page + 1}</button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * 20 >= totalElements}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Asymmetric Content Layer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-manrope text-xl font-bold text-slate-900">Regional Coverage</h3>
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest px-2 py-1 bg-orange-50 rounded">Live Map View</span>
            </div>
            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ad2c00 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">Interactive Network Map Engine</p>
              </div>
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
              <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
              <div className="absolute bottom-1/4 left-1/2 w-3 h-3 bg-orange-700 rounded-full animate-pulse ring-4 ring-orange-700/20"></div>
            </div>
          </div>
          <div className="bg-orange-700 p-8 rounded-xl text-white flex flex-col justify-between overflow-hidden relative shadow-lg shadow-orange-700/20">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-4xl mb-4">verified_user</span>
              <h4 className="text-xl font-bold font-manrope mb-2 uppercase">Compliance Alert</h4>
              <p className="text-white/80 text-sm font-medium leading-relaxed">3 facilities in the South Basin region require mandatory safety audit renewals by the end of this quarter.</p>
            </div>
            <button className="relative z-10 mt-8 w-full py-3 bg-white text-orange-700 font-bold rounded-xl hover:bg-orange-50 transition-colors uppercase text-xs tracking-widest">
                View Audit Schedule
            </button>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
      {isModalOpen && selectedHospital && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-orange-100 overflow-hidden animate-fadeIn">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 bg-orange-700 text-white">
                <h2 className="text-lg font-bold">Hospital Details</h2>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white/80 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">

                {/* Name */}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Name</span>
                  <span className="font-semibold text-slate-900">{selectedHospital.name}</span>
                </div>

                {/* ID */}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Hospital ID</span>
                  <span className="font-semibold text-slate-900">{selectedHospital.code}</span>
                </div>

                {/* Status */}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span className={`font-bold ${
                      selectedHospital.status === 'ACTIVE' ? 'text-green-600' : 'text-orange-600'
                  }`}>
            {selectedHospital.status}
          </span>
                </div>

                {/* Address Section */}
                <div className="mt-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h3 className="text-sm font-bold text-orange-700 mb-2 uppercase tracking-wide">
                    Address Information
                  </h3>

                  <p><b>Full Address:</b> {selectedHospital.address}</p>
                  <p><b>City:</b> {selectedHospital.city }</p>
                  <p><b>State:</b> {selectedHospital.state }</p>
                  <p><b>Pincode:</b> {selectedHospital.pincode }</p>
                </div>

              </div>
            </div>
          </div>
      )}

    </MainLayout>
  );
};

export default HospitalManagement;
