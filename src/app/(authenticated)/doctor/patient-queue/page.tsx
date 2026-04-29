'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { RootState } from '@/state/store';
import { AppointmentResponse, PatientResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken, sortByToken } from '@/utils/tokenHelper';

const PatientQueuePage = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientResponse>>({});
  const [activeTab, setActiveTab] = useState<'TODAY' | 'UPCOMING'>('TODAY');

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchData = useCallback(async (isBackground = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!isBackground) setLoading(true);
      const response = await appointmentService.list(0, 100);

      if (response.success && response.data) {
        const today = new Date().toISOString().split('T')[0];
        
        // Filter by current doctor
        const doctorAppointments = response.data.content.filter((appointment) => {
          return appointment.doctorId === user.id || appointment.doctorName === user.fullName;
        });

        setAppointments(doctorAppointments);

        // Fetch patient details for age and gender if not already in cache
        const patientIdsToFetch = Array.from(new Set(doctorAppointments.map(a => a.patientId)))
          .filter(id => !patientDetails[id]);

        if (patientIdsToFetch.length > 0) {
          const details = await Promise.all(
            patientIdsToFetch.map(id => patientService.get(id))
          );
          
          const newDetails: Record<string, PatientResponse> = { ...patientDetails };
          details.forEach(res => {
            if (res.success && res.data) {
              newDetails[res.data.id] = res.data;
            }
          });
          setPatientDetails(newDetails);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient queue', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user, patientDetails]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.appointmentTime.startsWith(today));

    const waiting = todayApps.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
    const inProgress = todayApps.filter((a) => a.status === 'DELAYED').length;
    const completed = todayApps.filter((a) => a.status === 'COMPLETED').length;

    return {
      total: todayApps.length,
      waiting,
      inProgress,
      completed,
    };
  }, [appointments]);

  const handleStartConsultation = async (id: string) => {
    try {
      const res = await appointmentService.updateStatus(id, { status: 'DELAYED' });
      if (res.success) {
        router.push(`/doctor/active-consultation?appointmentId=${id}`);
      } else {
        triggerGlobalToast('Failed to start consultation', 'error');
      }
    } catch (error) {
      console.error('Failed to start consultation', error);
      triggerGlobalToast('Failed to start consultation', 'error');
    }
  };

  const filteredAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    let base = appointments;
    if (activeTab === 'TODAY') {
      base = appointments.filter(a => 
        a.appointmentTime.startsWith(today) && 
        (a.status === 'SCHEDULED' || a.status === 'DELAYED' || a.status === 'CONFIRMED')
      );
    } else {
      base = appointments.filter(a => a.appointmentTime > today && a.status !== 'CANCELLED');
    }
    
    // Sort by token number for today, or by time for upcoming
    let sorted;
    if (activeTab === 'TODAY') {
      sorted = sortByToken(base);
    } else {
      sorted = [...base].sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
    }
    
    if (!searchTerm) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(
      (a) =>
        a.patientName.toLowerCase().includes(term) ||
        a.patientId.toLowerCase().includes(term)
    );
  }, [appointments, searchTerm, activeTab]);

  return (
    <MainLayout title="Patient Queue" hideTitle>
      <div className="space-y-section-gap font-inter">
        {/* Header Section */}
        <section className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-xl text-on-surface tracking-tight">Patient Queue</h2>
            <p className="text-gray-500 mt-1">Manage {activeTab === 'TODAY' ? "today's" : "upcoming"} appointments and surgical consultations.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white rounded-lg border border-outline-variant p-1">
              <button 
                onClick={() => setActiveTab('TODAY')}
                className={`px-4 py-1.5 text-label-md rounded-md transition-all ${activeTab === 'TODAY' ? 'bg-primary-container text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setActiveTab('UPCOMING')}
                className={`px-4 py-1.5 text-label-md rounded-md transition-all ${activeTab === 'UPCOMING' ? 'bg-primary-container text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Upcoming
              </button>
            </div>
          </div>
        </section>

        {/* Status Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-gray-500 font-label-sm">Total Patients</p>
              <p className="font-headline-md">{stats.total < 10 ? `0${stats.total}` : stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
            <div>
              <p className="text-gray-500 font-label-sm">Waiting</p>
              <p className="font-headline-md">{stats.waiting < 10 ? `0${stats.waiting}` : stats.waiting}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <span className="material-symbols-outlined">clinical_notes</span>
            </div>
            <div>
              <p className="text-gray-500 font-label-sm">Walk-in</p>
              <p className="font-headline-md">{stats.inProgress < 10 ? `0${stats.inProgress}` : stats.inProgress}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-gray-500 font-label-sm">Completed</p>
              <p className="font-headline-md">{stats.completed < 10 ? `0${stats.completed}` : stats.completed}</p>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm focus:ring-2 focus:ring-primary-container outline-none"
            placeholder="Search patient by name or ID..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Patient Table Section */}
        <section className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <div className="flex items-center gap-4">
              <h3 className="font-headline-sm text-on-surface">Queue List</h3>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-outline-variant">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-gray-600 uppercase">Live Queue</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button 
                onClick={() => fetchData()}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant">TOKEN</th>
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant">PATIENT NAME</th>
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant">AGE/GENDER</th>
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant">VISIT TIME</th>
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant">STATUS</th>
                  <th className="px-6 py-4 text-label-sm text-gray-500 border-b border-outline-variant text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Loading queue...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No patients in the queue for today.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-orange-600/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`font-bold ${appointment.status === 'DELAYED' ? 'text-primary' : 'text-gray-900'}`}>
                          #{formatToken(appointment)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border border-outline-variant">
                            {appointment.patientName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-label-md text-on-surface">{appointment.patientName}</p>
                            <p className="text-xs text-gray-500">ID: {appointment.patientId.substring(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body-md">
                          {patientDetails[appointment.patientId] 
                            ? `${calculateAge(patientDetails[appointment.patientId].dob)} / ${patientDetails[appointment.patientId].gender.charAt(0)}` 
                            : '-- / --'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body-md">
                          {appointment.appointmentTime.split('T')[1]?.slice(0, 5) || '--:--'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          appointment.status === 'DELAYED' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : appointment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status === 'DELAYED' ? 'Walk-in' : appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {appointment.status === 'DELAYED' ? (
                            <Link href={`/doctor/active-consultation?appointmentId=${appointment.id}`}>
                              <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">Resume</button>
                            </Link>
                          ) : appointment.status === 'COMPLETED' ? (
                            <button className="text-gray-500 bg-gray-50 px-4 py-1.5 rounded-lg text-xs font-semibold" disabled>Consulted</button>
                          ) : (
                            <button 
                              onClick={() => handleStartConsultation(appointment.id)}
                              className="border border-primary text-primary px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-50 transition-colors"
                            >
                              Start Consultation
                            </button>
                          )}
                          <button className="text-gray-500 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">history</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-white border-t border-outline-variant flex justify-between items-center">
            <span className="text-body-sm text-gray-500">
              Showing {filteredAppointments.length} of {appointments.length} patients
            </span>
            <div className="flex gap-2">
              <button className="p-2 border border-outline-variant rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="p-2 border border-outline-variant rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Action Grid / Insights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter pb-8">
          <div className="md:col-span-2 bg-primary-container/10 p-6 rounded-xl border border-primary-fixed flex items-center justify-between">
            <div>
              <h4 className="font-headline-sm text-on-primary-container">Next Surgery Scheduled</h4>
              <p className="text-on-primary-fixed-variant text-body-md mt-1">Laparoscopic Cholecystectomy - 12:30 PM with Team Alpha</p>
            </div>
            <button className="bg-primary text-white px-6 py-2 rounded-xl font-label-md hover:opacity-90 transition-all">
              View Details
            </button>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="font-label-md text-gray-500 mb-4 uppercase">Average Wait Time</h4>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl">18</span>
              <span className="text-body-md text-gray-500">mins</span>
            </div>
            <div className="mt-4 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_down</span>
              5% lower than yesterday
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default PatientQueuePage;
