'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { PatientResponse, AppointmentResponse } from '@/types/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Cake, 
  MapPin, 
  Edit, 
  Heart, 
  Activity, 
  Droplet, 
  Thermometer, 
  AlertTriangle, 
  Info,
  CalendarDays,
  FileText,
  Clock
} from 'lucide-react';

interface PatientProfileProps {
  params: Promise<{ id: string }>;
}

export default function PatientProfilePage({ params }: PatientProfileProps) {
  const { id } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientRes, appointmentsRes] = await Promise.all([
        patientService.get(id),
        appointmentService.list(0, 100) // Fetch all to filter for this patient
      ]);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        setAppointments(appointmentsRes.data.content.filter(a => a.patientId === id));
      }
    } catch (error) {
      console.error('Failed to fetch patient data', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [id]); // Only re-run if patient ID changes

  if (loading) return <MainLayout title="Loading..."><div className="p-8">Loading patient profile...</div></MainLayout>;
  if (!patient) return <MainLayout title="Not Found"><div className="p-8">Patient not found.</div></MainLayout>;

  return (
    <MainLayout title={`Profile: ${patient.fullName}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold text-slate-800">Patient Profile</h2>
        </div>

        {/* Patient Header Card */}
        <div className="bg-[var(--surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="size-24 md:size-32 rounded-2xl bg-[var(--background)] overflow-hidden border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center">
                  <span className="text-4xl font-black text-[var(--primary)] opacity-20">
                    {patient.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white dark:border-slate-900 size-8 rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xs">check</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{patient.fullName}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--background)] text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">
                    {patient.gender}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] font-medium">Patient ID: <span className="text-[var(--primary)] font-bold">#PAT-{patient.id.toString().padStart(5, '0')}</span></p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1"><Cake className="size-4" /> {new Date(patient.dob).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="size-4" /> {patient.address}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-3">
              <Link 
                href={`/reception/appointments/create?patientId=${patient.id}`}
                className="flex-1 min-w-[140px] px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2"
              >
                <CalendarDays className="size-5" /> Schedule Visit
              </Link>
              <button className="flex-1 min-w-[140px] px-4 py-2.5 bg-[var(--background)] text-[var(--text-primary)] rounded-lg font-bold text-sm border border-[var(--border)] hover:bg-[var(--primary-light)] transition-all flex items-center justify-center gap-2">
                <Edit className="size-5" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex gap-8 px-2 overflow-x-auto no-scrollbar">
            {['Overview', 'Visit History', 'Prescriptions'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab 
                  ? 'border-[var(--primary)] text-[var(--primary)]' 
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'Overview' && (
              <>
                {/* Timeline Component (Derived from 10_patient_timeline.html) */}
                <Card>
                  <h3 className="text-lg font-bold mb-6 text-[var(--text-primary)]">Medical Timeline</h3>
                  <div className="space-y-0">
                    {appointments.length === 0 && <p className="text-[var(--text-secondary)] italic">No medical activity recorded.</p>}
                    {appointments.map((apt, index) => (
                      <div key={apt.id} className="flex gap-4 pb-6 relative">
                        {index !== appointments.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-0 w-px bg-[var(--border)]"></div>
                        )}
                        <div className="size-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 z-10">
                          <FileText className="size-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-[var(--text-primary)]">{apt.status === 'COMPLETED' ? 'Visit' : 'Appointment'} - {apt.doctorName}</h4>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">{new Date(apt.appointmentTime).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{apt.notes || 'Routine checkup and consultation.'}</p>
                          <div className="flex gap-2 pt-2">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              apt.status === 'COMPLETED' ? 'bg-[var(--success-light)] text-[var(--success)]' : 'bg-[var(--primary-light)] text-[var(--primary)]'
                            }`}>
                              {apt.status}
                            </span>
                            <span className="px-2 py-1 rounded bg-[var(--background)] text-[10px] font-bold text-[var(--text-secondary)] uppercase border border-[var(--border)]">
                              {apt.doctorSpecialization || 'General'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
            
            {activeTab === 'Visit History' && (
              <Card>
                <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">All Visits</h3>
                <div className="space-y-4">
                  {appointments.filter(a => a.status === 'COMPLETED').map(visit => (
                    <div key={visit.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[var(--text-primary)]">{new Date(visit.appointmentTime).toLocaleDateString()}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{new Date(visit.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] font-medium">Doctor: {visit.doctorName}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{visit.notes}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
