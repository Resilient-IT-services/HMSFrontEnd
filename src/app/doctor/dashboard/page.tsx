'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import apiClient from '@/services/apiClient';
import { ApiResponse, AppointmentResponse } from '@/types/api';

const DoctorDashboard = () => {
  const [queue, setQueue] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<ApiResponse<{ content: AppointmentResponse[] }>>('/appointments?status=SCHEDULED');
        if (response.data.success) {
          setQueue(response.data.data?.content || []);
        }
      } catch (error) {
        console.error('Failed to fetch doctor queue', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  return (
    <MainLayout title="Consultation Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--primary-light)] rounded-lg text-[var(--primary)]">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-[var(--success)] text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> 8%
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Patients Today</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">24</h3>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Waiting Queue</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">{queue.length}</h3>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--success-light)] rounded-lg text-[var(--success)]">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Completed</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">12</h3>
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[var(--info-light)] rounded-lg text-[var(--info)]">
              <span className="material-symbols-outlined">medical_information</span>
            </div>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium">Avg. Consult Time</p>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">15m</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
              <h4 className="text-lg font-bold text-[var(--text-primary)]">Patient Waiting Queue</h4>
              <button className="text-[var(--primary)] text-sm font-bold hover:underline">Refresh Queue</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--background)]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Queue ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Wait Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loading && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-secondary)]">Loading queue...</td></tr>
                  )}
                  {!loading && queue.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-secondary)]">No patients in queue</td></tr>
                  )}
                  {!loading && queue.length > 0 && queue.map((row) => (
                    <tr key={row.id} className="hover:bg-[var(--background)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                            <span className="material-symbols-outlined text-sm">person</span>
                          </div>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{row.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">#Q-{row.id}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">12 mins</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-[10px] font-bold rounded bg-[var(--warning-light)] text-[var(--warning)] uppercase">Waiting</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="btn-primary text-xs py-1.5 px-3">Call Patient</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-6">Recent Consultations</h4>
            <div className="space-y-6">
              <div className="flex gap-4 border-l-2 border-[var(--primary)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Elena Gilbert</p>
                  <p className="text-xs text-[var(--text-secondary)]">Prescription: Paracetamol, Amoxicillin</p>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">10:30 AM</span>
              </div>
              <div className="flex gap-4 border-l-2 border-[var(--border)] pl-4">
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Damon Salvatore</p>
                  <p className="text-xs text-[var(--text-secondary)]">Diagnosis: Seasonal Flu</p>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">09:45 AM</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4">Schedule Next</h4>
            <div className="p-4 rounded-lg bg-[var(--primary-light)] border border-[var(--primary)]/10">
              <p className="text-sm font-bold text-[var(--primary)]">Lunch Break</p>
              <p className="text-xs text-[var(--primary)]/80">01:00 PM - 02:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;
