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
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await userService.listUsers(page, 20, debouncedSearch, roleFilter, activeFilter);
      if (userRes.success && userRes.data) {
        const usersWithRoles = (userRes.data.content || []).map(u => {
          const allRoles = new Set<Role>();
          if (u.memberships) {
            for (const m of u.memberships) {
              if (m.roleAssignments) {
                for (const ra of m.roleAssignments) {
                  allRoles.add(ra.roleCode as Role);
                }
              }
              if (m.roles) {
                for (const r of m.roles) {
                  allRoles.add(r as Role);
                }
              }
            }
          }
          if (u.superuser) allRoles.add('SUPER_ADMIN');
          return { ...u, roles: Array.from(allRoles) };
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <MainLayout title="User Management">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="font-headline-xl text-on-surface">User Management</h2>
            <p className="font-body-md text-secondary mt-1">Configure and manage administrative and medical staff access.</p>
          </div>
          <Link 
            href="/admin/users/create"
            className="bg-primary-container text-on-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-label-md shadow-sm hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Create User
          </Link>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {/* Table Filters */}
          <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-bright">
            <div className="flex flex-wrap items-center gap-2">
              <select 
                className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-on-surface outline-none"
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
              <select 
                className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-on-surface outline-none"
                value={activeFilter === undefined ? '' : activeFilter.toString()}
                onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input 
                  className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary-container outline-none w-full md:w-64" 
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
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-md text-secondary">Name</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Mobile</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Role(s)</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Hospital</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Specialization</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Department</th>
                  <th className="px-6 py-4 font-label-md text-secondary">Status</th>
                  <th className="px-6 py-4 font-label-md text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-secondary font-body-md">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-secondary font-body-md">No users found.</td>
                  </tr>
                ) : users.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-bright transition-colors font-body-md">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center text-primary font-bold">
                          {getInitials(row.fullName || row.username)}
                        </div>
                        <div>
                          <p className="font-label-md text-on-surface">{row.fullName || row.username}</p>
                          <p className="font-body-sm text-secondary">{row.username} • {row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md">{row.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {row.roles?.map(role => (
                          <span key={role} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase rounded-md border border-orange-100">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md">
                      {row.memberships?.[0]?.hospitalName || 'System'}
                    </td>
                    <td className="px-6 py-4 text-body-md">
                      {row.memberships?.[0]?.specialization || row.doctorInfo?.specialization || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-body-md">
                      {row.memberships?.[0]?.departmentName || row.memberships?.[0]?.roleAssignments?.[0]?.departmentName || 'General'}
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
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => router.push(`/admin/users/${row.id}`)}
                          title="Edit User"
                          className="p-2 text-secondary hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-bright">
            <p className="font-body-sm text-secondary">
              Showing <span className="font-bold text-on-surface">{page * 20 + 1}</span> to <span className="font-bold text-on-surface">{Math.min((page + 1) * 20, totalElements)}</span> of <span className="font-bold text-on-surface">{totalElements}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-outline-variant hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1 bg-primary-container text-on-primary rounded-lg font-label-md">{page + 1}</span>
              </div>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) >= totalPages}
                className="p-2 rounded-lg border border-outline-variant hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Layout Contextual Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl p-6 flex items-center gap-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-headline-sm text-on-surface">Bulk Import Users</h3>
              <p className="font-body-md text-secondary mt-2 max-w-md">Import large staff directories using our CSV or Excel templates with automatic role mapping.</p>
              <button className="mt-4 px-4 py-2 border border-primary text-primary font-label-md rounded-lg hover:bg-primary-fixed transition-colors">
                Download Template
              </button>
            </div>
            <div className="ml-auto hidden md:block">
              <img className="w-40 h-40 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKRa21wn0izbh4kPOW161cmB-k9pmGMSucAJxT44T0yQi09hXdbObJ3grxbPb4guqqYFPVOLeN4tKTYcOu1il6g-hrMS-3xXJwHZvS20QUCtedmCAwVswS6Weak8HFfCGFB-h4KalZbmVmfSzGIavYqVfZ5QkLKf7BNThPMSvoeanX9-yDnz3CHygnJwsGdP0sI1xY7SpeqLAdlxc0fJlTM6HMFgD7WGN1LsmrI1p6ryR8UqPetFCyxpJkzMUB4lVspHnHDv86fSQ" />
            </div>
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-50 to-transparent pointer-events-none"></div>
          </div>
          <div className="bg-primary text-on-primary rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-headline-sm">Security Audit</h3>
              <p className="font-body-md text-orange-100 mt-2">3 users haven't enabled MFA. High security risk detected.</p>
              <button className="mt-4 px-4 py-2 bg-white text-primary font-label-md rounded-lg hover:bg-orange-50 transition-colors">
                Review Security
              </button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-orange-400/20 rotate-12" style={{ fontVariationSettings: "'wght' 700" }}>security</span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserManagement;
