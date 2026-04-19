'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role, CreateUserRequest } from '@/types/api';
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  
  const [newUser, setNewUser] = useState<CreateUserRequest>({ 
    username: '', 
    password: '', 
    roles: [] as Role[],
    fullName: '',
    gender: 'MALE',
    dob: '',
    phone: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiResponse<UserResponse[]>>('/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.roles.length === 0) {
      alert('Please select at least one role');
      return;
    }
    try {
      const response = await apiClient.post<ApiResponse<UserResponse>>('/users', newUser);
      if (response.data.success) {
        setShowUserForm(false);
        setNewUser({ 
          username: '', 
          password: '', 
          roles: [], 
          fullName: '',
          gender: 'MALE',
          dob: '',
          phone: ''
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };

  const handleRoleToggle = (role: Role) => {
    setNewUser(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const roleOptions: Role[] = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'RECEPTIONIST', 'NURSE'];

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { 
      header: 'Username', 
      accessor: (row: UserResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)]">{row.username}</span>
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
      header: 'Actions',
      accessor: () => (
        <div className="flex space-x-2">
          <button className="p-2 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-colors">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-2 text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <MainLayout title="User Management">
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
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

      {/* User Creation Modal */}
      <Modal 
        isOpen={showUserForm} 
        onClose={() => setShowUserForm(false)} 
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <FormField label="Full Name" required>
            <input 
              className="form-input" 
              value={newUser.fullName}
              onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
              placeholder="e.g. John Doe"
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Gender" required>
              <select 
                className="form-input" 
                value={newUser.gender}
                onChange={(e) => setNewUser({...newUser, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER'})}
                required
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </FormField>
            <FormField label="Date of Birth" required>
              <input 
                type="date"
                className="form-input" 
                value={newUser.dob}
                onChange={(e) => setNewUser({...newUser, dob: e.target.value})}
                required
              />
            </FormField>
          </div>
          <FormField label="Phone Number">
            <input 
              className="form-input" 
              value={newUser.phone}
              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
              placeholder="e.g. +91 9876543210"
            />
          </FormField>
          <FormField label="Username" required>
            <input 
              className="form-input" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              placeholder="e.g. doctor.smith"
              required
            />
          </FormField>
          <FormField label="Temporary Password" required>
            <input 
              type="password"
              className="form-input" 
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              placeholder="••••••••"
              required
            />
          </FormField>
          <FormField label="User Roles" required>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {roleOptions.map(role => (
                <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newUser.roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)]">{role}</span>
                </label>
              ))}
            </div>
          </FormField>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">Create User</button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
};

export default UserManagement;
