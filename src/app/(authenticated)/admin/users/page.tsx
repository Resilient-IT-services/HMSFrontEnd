'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { userService } from '@/services/userService';
import { UserResponse, Role } from '@/types/api';
import { useDebounce } from '@/hooks/useDebounce';

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await userService.listUsers(page, 20, debouncedSearch, roleFilter, activeFilter);
      if (userRes.success && userRes.data) {
        const usersWithRoles = (userRes.data.content || []).map(u => {
          const allRoles = new Set<string>();
          
          if (u.memberships) {
            u.memberships.forEach((m: any) => {
              // Extract roles from membership.roles array
              if (m.roles && Array.isArray(m.roles)) {
                m.roles.forEach((r: string) => allRoles.add(r));
              }
              // Fallback for roleAssignments if needed
              if (m.roleAssignments) {
                m.roleAssignments.forEach((ra: any) => {
                  if (ra.roleCode) allRoles.add(ra.roleCode);
                });
              }
            });
          }
          
          if (u.superuser) allRoles.add('SUPER_ADMIN');
          
          return { ...u, roles: [...allRoles] as Role[] };
        });
        setUsers(usersWithRoles);
        setTotalElements(userRes.data.totalElements);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter, activeFilter]);

  const totalPages = Math.ceil(totalElements / 20);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <MainLayout title="User Management" hideTitle>
      <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f7f9fb] min-h-screen font-inter">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-manrope text-3xl font-bold text-slate-900 uppercase">User Management</h2>
            <p className="text-slate-500 mt-1">Manage hospital staff credentials and access levels</p>
          </div>
          <button 
            onClick={() => router.push('/admin/users/create')}
            className="bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-orange-700/10 active:scale-95"
          >
            <span className="material-symbols-outlined">person_add</span>
            Create User
          </button>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-700/20 focus:border-orange-700 transition-all outline-none bg-white text-sm" 
              placeholder="Search by name, email, or role..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium outline-none"
              value={roleFilter || ''}
              onChange={(e) => setRoleFilter(e.target.value || undefined)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="PHARMACIST">Pharmacist</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm">
              <span className="material-symbols-outlined text-xl">file_download</span>
              Export
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700 font-manrope text-sm">User Details</th>
                <th className="px-6 py-4 font-semibold text-slate-700 font-manrope text-sm">Roles</th>
                <th className="px-6 py-4 font-semibold text-slate-700 font-manrope text-sm">Hospital Context</th>
                <th className="px-6 py-4 font-semibold text-slate-700 font-manrope text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 font-manrope text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Loading staff records...</td></tr>
              ) : (users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No staff members found.</td></tr>
              ) : users.map((user) => {
                const primaryMembership = user.memberships?.[0];
                const membershipCount = user.memberships?.length ?? 0;
                const primaryHospitalName = primaryMembership?.hospitalName || 'Unnamed Hospital';
                const additionalHospitalSuffix = membershipCount > 1 ? ` + ${membershipCount - 1}` : '';
                const hospitalSummary = membershipCount > 0
                  ? `${primaryHospitalName}${additionalHospitalSuffix}`
                  : 'No Hospital Assigned';
                const departmentName = primaryMembership?.roleAssignments?.[0]?.departmentName || 'General';

                return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold uppercase overflow-hidden border-2 border-orange-50">
                        {user.fullName ? user.fullName.slice(0, 2) : user.username.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{user.fullName || user.username}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 uppercase border border-orange-100">
                          {user.roles[0]}{user.roles.length > 1 ? ` + ${user.roles.length - 1}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                        <p className="text-sm text-slate-600 font-medium">
                          {hospitalSummary}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {departmentName}
                        </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${user.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <button 
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="p-2 text-slate-400 hover:text-orange-700 transition-colors border border-slate-100 rounded-lg hover:bg-white hover:shadow-sm"
                        title="Edit User"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {page * 20 + 1} to {Math.min((page + 1) * 20, totalElements)} of {totalElements} users
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 bg-white disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button className="px-4 py-1.5 rounded-lg bg-orange-700 text-white font-bold text-xs">{page + 1}</button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * 20 >= totalElements}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Analytics Bento Grid Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-manrope text-xl font-bold text-slate-900 mb-6">User Permissions Matrix</h3>
            <div className="space-y-4">
              {[
                  { label: 'Full System Access', icon: 'security', color: 'text-red-500', bg: 'bg-red-50', count: 3 },
                  { label: 'Patient Records Edit', icon: 'clinical_notes', color: 'text-orange-500', bg: 'bg-orange-50', count: 16 },
                  { label: 'Inventory Management', icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-50', count: 8 }
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${p.bg} rounded-lg ${p.color}`}>
                        <span className="material-symbols-outlined text-xl">{p.icon}</span>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.count} Members</span>
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">+{p.count}</div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-orange-700 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-manrope text-xl font-bold mb-2">Staff Distribution</h3>
              <p className="text-xs opacity-80 mb-8 uppercase font-bold tracking-widest">Global Assignment Overview</p>
              <div className="space-y-6">
                {[
                    { label: 'Clinical Staff', val: '64%' },
                    { label: 'Administrative', val: '22%' },
                    { label: 'Technical/Pharmacy', val: '14%' }
                ].map((s, i) => (
                    <div key={i}>
                        <div className="flex justify-between items-center text-xs font-bold mb-2 uppercase tracking-tighter">
                            <span>{s.label}</span>
                            <span>{s.val}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: s.val }}></div>
                        </div>
                    </div>
                ))}
              </div>
            </div>
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-white opacity-10 text-[140px]">groups</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
