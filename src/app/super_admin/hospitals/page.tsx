'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import apiClient from '@/services/apiClient';
import { ApiResponse, HospitalResponse } from '@/types/api';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalResponse | null>(null);
  const [newHospital, setNewHospital] = useState({ name: '', code: '', address: '' });

  // ✅ NEW STATE
  const [isDeactivated, setIsDeactivated] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const hospitalRes = await apiClient.get<ApiResponse<HospitalResponse[]>>('/hospitals');
      if (hospitalRes.data.success) {
        setHospitals(hospitalRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch hospitals', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newHospital,
        status: isDeactivated ? 'INACTIVE' : 'ACTIVE' // ✅ NEW
      };

      if (editingHospital) {
        const response = await apiClient.put<ApiResponse<HospitalResponse>>(
            `/hospitals/${editingHospital.id}`,
            payload
        );
        if (response.data.success) {
          setShowHospitalForm(false);
          setEditingHospital(null);
          setNewHospital({ name: '', code: '', address: '' });
          setIsDeactivated(false); // ✅ NEW
          fetchData();
        }
      } else {
        const response = await apiClient.post<ApiResponse<HospitalResponse>>(
            '/hospitals',
            payload
        );
        if (response.data.success) {
          setShowHospitalForm(false);
          setNewHospital({ name: '', code: '', address: '' });
          setIsDeactivated(false); // ✅ NEW
          fetchData();
        }
      }
    } catch (error) {
      console.error('Failed to save hospital', error);
    }
  };

  const handleEditClick = (hospital: HospitalResponse) => {
    setEditingHospital(hospital);
    setNewHospital({
      name: hospital.name,
      code: hospital.code,
      address: hospital.address || ''
    });

    // ✅ NEW
    setIsDeactivated(hospital.status === 'INACTIVE');

    setShowHospitalForm(true);
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
    {
      header: 'Code',
      accessor: (row: HospitalResponse) => (
          <code className="bg-[var(--background)] px-2 py-1 rounded text-xs">
            {row.code}
          </code>
      )
    },
    { header: 'Address', accessor: (row: HospitalResponse) => row.address || 'N/A' },
    {
      header: 'Status',
      accessor: (row: HospitalResponse) => {
        const statusClass =
            row.status === 'ACTIVE'
                ? 'bg-[var(--success-light)] text-[var(--success)]'
                : 'bg-slate-100 text-slate-500';
        return (
            <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${statusClass}`}>
            {row.status || 'ACTIVE'}
          </span>
        );
      }
    },
    {
      header: 'Action',
      accessor: (row: HospitalResponse) => (
          <button
              onClick={() => handleEditClick(row)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all"
          >
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
      )
    }
  ];

  return (
      <MainLayout title="Hospitals">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Registered Hospitals
          </h2>
          <button
              onClick={() => {
                setEditingHospital(null);
                setNewHospital({ name: '', code: '', address: '' });
                setIsDeactivated(false); // ✅ NEW
                setShowHospitalForm(true);
              }}
              className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Register Hospital
          </button>
        </div>

        <Card>
          <Table columns={hospitalColumns} data={hospitals} isLoading={loading} />
        </Card>

        <Modal
            isOpen={showHospitalForm}
            onClose={() => setShowHospitalForm(false)}
            title={editingHospital ? 'Edit Hospital' : 'Register New Hospital'}
        >
          <form onSubmit={handleCreateHospital} className="p-6 space-y-4">
            <FormField label="Hospital Name" required>
              <input
                  className="form-input"
                  value={newHospital.name}
                  onChange={(e) =>
                      setNewHospital({ ...newHospital, name: e.target.value })
                  }
                  required
              />
            </FormField>

            <FormField label="Hospital Code" required>
              <input
                  className="form-input"
                  value={newHospital.code}
                  onChange={(e) =>
                      setNewHospital({ ...newHospital, code: e.target.value })
                  }
                  required
              />
            </FormField>

            <FormField label="Full Address">
            <textarea
                className="form-input min-h-[100px]"
                value={newHospital.address}
                onChange={(e) =>
                    setNewHospital({ ...newHospital, address: e.target.value })
                }
            />
            </FormField>

            {/* ✅ NEW CHECKBOX */}
            <FormField label="Deactivate Hospital">
              <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={isDeactivated}
                    onChange={(e) => setIsDeactivated(e.target.checked)}
                />
                <span className="text-sm">Mark as Deactivated</span>
              </div>
            </FormField>

            <div className="pt-4 flex gap-3">
              <button
                  type="button"
                  onClick={() => setShowHospitalForm(false)}
                  className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)]"
              >
                Cancel
              </button>

              <button type="submit" className="flex-1 btn-primary">
                {editingHospital ? 'Update' : 'Register'}
              </button>
            </div>
          </form>
        </Modal>
      </MainLayout>
  );
}