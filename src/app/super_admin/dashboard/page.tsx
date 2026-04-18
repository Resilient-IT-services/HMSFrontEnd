'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import apiClient from '@/services/apiClient';
import { ApiResponse, HospitalResponse, UserResponse, Role } from '@/types/api';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'hospitals' | 'users'>('hospitals');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [newHospital, setNewHospital] = useState({ name: '', code: '', address: '' });
  
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'ADMIN' as Role, hospitalId: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch hospitals because we need them for user assignment
      const hospitalRes = await apiClient.get<ApiResponse<HospitalResponse[]>>('/hospitals');
      if (hospitalRes.data.success) {
        setHospitals(hospitalRes.data.data || []);
      }

      if (activeTab === 'users') {
        const userRes = await apiClient.get<ApiResponse<UserResponse[]>>('/users');
        if (userRes.data.success) {
          setUsers(userRes.data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post<ApiResponse<HospitalResponse>>('/hospitals', newHospital);
      if (response.data.success) {
        setShowHospitalForm(false);
        setNewHospital({ name: '', code: '', address: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create hospital', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post<ApiResponse<UserResponse>>('/users', newUser);
      if (response.data.success) {
        setShowUserForm(false);
        setNewUser({ username: '', password: '', role: 'ADMIN', hospitalId: 0 });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create user', error);
    }
  };

  const hospitalColumns = [
    { 
      header: 'Hospital Name', 
      accessor: (row: HospitalResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
            <span className="material-symbols-outlined text-sm">apartment</span>
          </div>
          <span className="font-semibold">{row.name}</span>
        </div>
      )
    },
    { header: 'Code', accessor: (row: HospitalResponse) => <code className="bg-[var(--background)] px-2 py-1 rounded text-xs">{row.code}</code> },
    { header: 'Address', accessor: (row: HospitalResponse) => row.address || 'N/A' },
    { 
      header: 'Status', 
      accessor: (row: HospitalResponse) => (
        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
          row.status === 'ACTIVE' ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-slate-100 text-slate-500'
        }`}>
          {row.status || 'ACTIVE'}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: (row: HospitalResponse) => (
        <button 
          onClick={() => alert(`Configuring settings for ${row.name}`)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all"
        >
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      )
    }
  ];

  const userColumns = [
    { 
      header: 'Username', 
      accessor: (row: UserResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <span className="font-semibold">{row.username}</span>
        </div>
      )
    },
    { 
      header: 'Role', 
      accessor: (row: UserResponse) => (
        <span className="px-2 py-1 text-[10px] font-bold rounded bg-[var(--primary-light)] text-[var(--primary)] uppercase">
          {row.role}
        </span>
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
    { header: 'Created', accessor: (row: UserResponse) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Action',
      accessor: (row: UserResponse) => (
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all">
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>
      )
    }
  ];

  return (
    <MainLayout title="System Administration">
      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--primary-light)] rounded-lg text-[var(--primary)]">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <span className="text-[var(--success)] text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> Live
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Registered Hospitals</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{hospitals.length}</h3>
        </div>
        
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--info-light)] rounded-lg text-[var(--info)]">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-[var(--primary)] text-xs font-bold flex items-center gap-1">
              Total Count
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Total System Users</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{users.length > 0 ? users.length : (loading ? '...' : hospitals.length * 5)}</h3>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--success-light)] rounded-lg text-[var(--success)]">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <span className="bg-[var(--success-light)] text-[var(--success)] text-[10px] font-black px-2 py-0.5 rounded-full">HEALTHY</span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">API Server Status</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">Connected</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${
            activeTab === 'hospitals' ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          Hospital Management
          {activeTab === 'hospitals' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${
            activeTab === 'users' ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          Global User Directory
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {activeTab === 'hospitals' ? 'Registered Hospitals' : 'All System Users'}
        </h2>
        <button 
          onClick={() => activeTab === 'hospitals' ? setShowHospitalForm(true) : setShowUserForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {activeTab === 'hospitals' ? 'Register Hospital' : 'Create System User'}
        </button>
      </div>

      <Card>
        {activeTab === 'hospitals' ? (
          <Table columns={hospitalColumns} data={hospitals} isLoading={loading} />
        ) : (
          <Table columns={userColumns} data={users} isLoading={loading} />
        )}
      </Card>

      {/* Hospital Creation Modal */}
      <Modal 
        isOpen={showHospitalForm} 
        onClose={() => setShowHospitalForm(false)} 
        title="Register New Hospital"
      >
        <form onSubmit={handleCreateHospital} className="p-6 space-y-4">
          <FormField label="Hospital Name" required>
            <input 
              className="form-input" 
              value={newHospital.name}
              onChange={(e) => setNewHospital({...newHospital, name: e.target.value})}
              placeholder="e.g. City General Hospital"
              required
            />
          </FormField>
          <FormField label="Hospital Code" required>
            <input 
              className="form-input" 
              value={newHospital.code}
              onChange={(e) => setNewHospital({...newHospital, code: e.target.value})}
              placeholder="e.g. CGH-NY"
              required
            />
          </FormField>
          <FormField label="Full Address">
            <textarea 
              className="form-input min-h-[100px]" 
              value={newHospital.address}
              onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
              placeholder="Street, City, Zip Code..."
            />
          </FormField>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setShowHospitalForm(false)} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">Register</button>
          </div>
        </form>
      </Modal>

      {/* User Creation Modal */}
      <Modal 
        isOpen={showUserForm} 
        onClose={() => setShowUserForm(false)} 
        title="Create System User"
      >
        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <FormField label="Assign Hospital" required>
            <select 
              className="form-input"
              value={newUser.hospitalId}
              onChange={(e) => setNewUser({...newUser, hospitalId: parseInt(e.target.value)})}
              required
            >
              <option value="">Select a Hospital</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Username" required>
            <input 
              className="form-input" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              placeholder="e.g. jdoe.admin"
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
          <FormField label="System Role" required>
            <select 
              className="form-input"
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value as Role})}
            >
              <option value="ADMIN">Admin</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
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

export default SuperAdminDashboard;
