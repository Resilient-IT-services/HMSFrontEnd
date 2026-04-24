'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role } from '@/types/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

const UserManagement = () => {
  const { isSuperMode } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await apiClient.get<ApiResponse<UserResponse[]>>(`/users?includeDeleted=false`);
      if (userRes.data.success) {
        const usersWithRoles = (userRes.data.data || []).map(u => {
          const allRoles = new Set<Role>();
          if (u.memberships) {
            for (const m of u.memberships) {
              for (const r of m.roles) {
                allRoles.add(r);
              }
            }
          }
          return { ...u, roles: [...allRoles] };
        });
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <MainLayout title="User Management">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-headline-xl text-[var(--on-surface)]">User Management</h2>
            <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Configure and manage administrative and medical staff access.</p>
          </div>
          <Link 
            href="/admin/users/create"
            className="bg-[var(--primary)] text-white inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold shadow-sm hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Create User
          </Link>
        </div>

        {/* Stats/Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[var(--on-surface-variant)] font-bold text-[12px] uppercase tracking-wider">Total Users</span>
              <div className="p-2 bg-slate-50 rounded-lg text-[var(--primary)]">
                <span className="material-symbols-outlined">person</span>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-[var(--on-surface)]">{users.length}</p>
            <p className="font-body-sm text-green-600 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12% this month
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[var(--on-surface-variant)] font-bold text-[12px] uppercase tracking-wider">Doctors</span>
              <div className="p-2 bg-slate-50 rounded-lg text-[var(--primary)]">
                <span className="material-symbols-outlined">medical_services</span>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-[var(--on-surface)]">
              {users.filter(u => u.roles.includes('DOCTOR')).length}
            </p>
            <p className="font-body-sm text-[var(--on-surface-variant)] mt-1">Active Medical Staff</p>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[var(--on-surface-variant)] font-bold text-[12px] uppercase tracking-wider">Admins</span>
              <div className="p-2 bg-slate-50 rounded-lg text-[var(--primary)]">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-[var(--on-surface)]">
              {users.filter(u => u.roles.includes('ADMIN') || u.roles.includes('SUPER_ADMIN')).length}
            </p>
            <p className="font-body-sm text-orange-600 mt-1">System Controllers</p>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[var(--on-surface-variant)] font-bold text-[12px] uppercase tracking-wider">Active Now</span>
              <div className="p-2 bg-slate-50 rounded-lg text-[var(--primary)]">
                <span className="material-symbols-outlined">bolt</span>
              </div>
            </div>
            <p className="text-2xl font-bold mt-2 text-[var(--on-surface)]">89</p>
            <p className="font-body-sm text-green-600 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Live Session
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Table Filters */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-[14px] text-[var(--on-surface)] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Filters
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-[14px] focus:ring-2 focus:ring-[var(--primary)] outline-none w-full md:w-64 font-body-md" 
                  placeholder="Search user..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 font-bold text-[12px] text-[var(--on-surface-variant)] uppercase">Name</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-[var(--on-surface-variant)] uppercase">Mobile</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-[var(--on-surface-variant)] uppercase">Role(s)</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-[var(--on-surface-variant)] uppercase">Status</th>
                  <th className="px-6 py-4 font-bold text-[12px] text-[var(--on-surface-variant)] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-body-md">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-body-md">No users found.</td>
                  </tr>
                ) : filteredUsers.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors font-body-md">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-bold">
                          {getInitials(row.fullName || row.username)}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-[var(--on-surface)]">{row.fullName || row.username}</p>
                          <p className="font-body-sm text-[var(--on-surface-variant)]">{row.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[var(--on-surface)]">{row.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.roles?.map(role => (
                          <span key={role} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase rounded-md border border-orange-100">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                        row.active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                        {row.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/admin/users/${row.id}`)}
                        className="p-2 text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/30">
            <p className="font-body-sm text-[var(--on-surface-variant)]">
              Showing <span className="font-bold text-[var(--on-surface)]">1</span> to <span className="font-bold text-[var(--on-surface)]">{filteredUsers.length}</span> of <span className="font-bold text-[var(--on-surface)]">{users.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Layout Contextual Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Bulk Import Users</h3>
              <p className="text-[14px] text-gray-500 mt-2 max-w-md">Import large staff directories using our CSV or Excel templates with automatic role mapping.</p>
              <button className="mt-4 px-4 py-2 border border-[var(--primary)] text-[var(--primary)] font-bold text-[14px] rounded-lg hover:bg-[var(--primary-light)] transition-colors">
                Download Template
              </button>
            </div>
            <div className="ml-auto hidden md:block">
              <img className="w-40 h-40 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKRa21wn0izbh4kPOW161cmB-k9pmGMSucAJxT44T0yQi09hXdbObJ3grxbPb4guqqYFPVOLeN4tKTYcOu1il6g-hrMS-3xXJwHZvS20QUCtedmCAwVswS6Weak8HFfCGFB-h4KalZbmVmfSzGIavYqVfZ5QkLKf7BNThPMSvoeanX9-yDnz3CHygnJwsGdP0sI1xY7SpeqLAdlxc0fJlTM6HMFgD7WGN1LsmrI1p6ryR8UqPetFCyxpJkzMUB4lVspHnHDv86fSQ" />
            </div>
          </div>
          <div className="bg-[var(--primary)] text-white rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold">Security Audit</h3>
              <p className="text-[14px] text-orange-100 mt-2">3 users haven't enabled MFA. High security risk detected.</p>
              <button className="mt-4 px-4 py-2 bg-white text-[var(--primary)] font-bold text-[14px] rounded-lg hover:bg-orange-50 transition-colors">
                Review Security
              </button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-white/10 rotate-12">security</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
