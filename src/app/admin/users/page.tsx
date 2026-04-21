'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role, HospitalResponse } from '@/types/api';
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-react';

import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { UserCreationModal } from '@/components/admin/UserCreationModal';
import { RoleAllocationModal } from '@/components/admin/RoleAllocationModal';
import { UserEditModal } from '@/components/admin/UserEditModal';

const UserManagement = () => {
  const { user: currentUser, isSuperMode } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Allocation state
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const fetchData = React.useCallback(async () => {
    // ... fetchData implementation ...
    try {
      setLoading(true);
      
      const userRes = await apiClient.get<ApiResponse<UserResponse[]>>(`/users?includeDeleted=${showDeleted}`);
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

      if (isSuperMode) {
        const hospRes = await apiClient.get<ApiResponse<HospitalResponse[]>>('/hospitals');
        if (hospRes.data.success) {
          setHospitals(hospRes.data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [isSuperMode, showDeleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/users/${id}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete user', error);
      }
    }
  };

  const roleOptions: Role[] = isSuperMode 
    ? ['ADMIN', 'DOCTOR', 'PHARMACIST', 'RECEPTIONIST', 'NURSE', 'SUPER_ADMIN']
    : ['ADMIN', 'DOCTOR', 'PHARMACIST', 'RECEPTIONIST', 'NURSE'];

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { 
      header: 'Username', 
      accessor: (row: UserResponse) => (
        <div className={`flex items-center gap-3 ${row.deleted ? 'opacity-50' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[var(--text-primary)]">{row.username}</span>
            {row.deleted && <span className="text-[10px] text-[var(--error)] font-bold uppercase">Deleted</span>}
          </div>
        </div>
      )
    },
    { 
      header: 'Roles', 
      accessor: (row: UserResponse) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map(role => (
            <span key={role} className="px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--primary-light)] text-[var(--primary)] uppercase">
              {role}
            </span>
          ))}
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (row: UserResponse) => (
        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
          row.active ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--error-light)] text-[var(--error)]'
        }`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: UserResponse) => (
        <div className="flex space-x-2 items-center">
          <button 
            onClick={() => {
              setSelectedUser(row);
              setShowEditForm(true);
            }}
            className="p-2 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {isSuperMode && !row.deleted && (
            <button 
              onClick={() => {
                setSelectedUser(row);
                setShowAllocationForm(true);
              }}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
            >
              Allocate
            </button>
          )}
          {!row.deleted && (
            <button 
              onClick={() => handleDelete(row.id)}
              className="p-2 text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <MainLayout title="User Management">
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[var(--text-secondary)]" />
              </span>
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showDeleted} 
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">Show Deleted Users</span>
            </label>
          </div>
          <button 
            onClick={() => setShowUserForm(true)}
            className="btn-primary flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </button>
        </div>

        <Table columns={columns} data={filteredUsers} isLoading={loading} />
      </Card>

      <UserCreationModal
        key={showUserForm ? 'open' : 'closed'}
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        onSuccess={fetchData}
        isSuperMode={isSuperMode}
        hospitals={hospitals}
        currentUserHospitalId={currentUser?.hospitalId}
        roleOptions={roleOptions}
      />

      <UserEditModal
        key={showEditForm ? `edit-${selectedUser?.id}` : 'edit-closed'}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={fetchData}
        user={selectedUser}
      />

      <RoleAllocationModal
        key={showAllocationForm ? `allocate-${selectedUser?.id}` : 'allocate-closed'}
        isOpen={showAllocationForm}
        onClose={() => setShowAllocationForm(false)}
        onSuccess={fetchData}
        selectedUser={selectedUser}
        hospitals={hospitals}
        roleOptions={roleOptions}
      />
    </MainLayout>
  );
};

export default UserManagement;
