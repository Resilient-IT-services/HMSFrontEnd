'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { FormField } from '@/components/ui/FormField';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse } from '@/types/api';
import { UserPlus, Search, Edit2, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
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

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Username', accessor: (row: UserResponse) => row.username },
    { 
      header: 'Role', 
      accessor: (row: UserResponse) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {row.role}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row: UserResponse) => (
        <div className="flex space-x-2">
          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
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
          <button className="btn-primary flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </button>
        </div>

        <Table columns={columns} data={filteredUsers} isLoading={loading} />
      </Card>
    </MainLayout>
  );
};

export default UserManagement;
