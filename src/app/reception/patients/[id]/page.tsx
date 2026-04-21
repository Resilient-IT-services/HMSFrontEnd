'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { PatientResponse, AppointmentResponse } from '@/types/api';
import Link from 'next/link';
import { 
  Cake, 
  MapPin, 
  Event, 
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

const PatientProfilePage = ({ params }: PatientProfileProps) => {
  const { id } = use(params);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientRes, appointmentsRes] = await Promise.all([
        patientService.get(Number.parseInt(id)),
        appointmentService.list(0, 100) // Fetch all to filter for this patient
      ]);

      if (patientRes.success && patientRes.data) {
        setPatient(patientRes.data);
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        setAppointments(appointmentsRes.data.content.filter(a => a.patientId === Number.parseInt(id)));
      }
    } catch (error) {
      console.error('Failed to fetch patient data', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <MainLayout title="Loading..."><div className="p-8">Loading patient profile...</div></MainLayout>;
  if (!patient) return <MainLayout title="Not Found"><div className="p-8">Patient not found.</div></MainLayout>;

  return (
    <MainLayout title={`Profile: ${patient.fullName}`}>
      <div className="max-w-6xl mx-auto space-y-6">
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
                  <span className="flex items-center gap-1"><Cake className="size-4" /> {new Date(patient.dob).toLocaleDateString()} (38y)</span>
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

          {/* Vitals Summary Strip */}
          <div className="border-t border-[var(--border)] bg-[var(--background)]/50 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
                <Heart className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Heart Rate</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">72 <span className="text-xs font-normal text-[var(--text-secondary)] opacity-50">bpm</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <Activity className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Blood Pressure</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">120/80 <span className="text-xs font-normal text-[var(--text-secondary)] opacity-50">mmHg</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center">
                <Droplet className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Oxygen (SpO2)</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">98% <span className="text-xs font-normal text-[var(--text-secondary)] opacity-50">Normal</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                <Thermometer className="size-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Body Temp</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">98.6 <span className="text-xs font-normal text-[var(--text-secondary)] opacity-50">°F</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex gap-8 px-2 overflow-x-auto no-scrollbar">
            {['Overview', 'Personal Details', 'Visit History', 'Prescriptions'].map(tab => (
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
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'Overview' && (
              <>
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Patient Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-50">Full Name</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{patient.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-50">Phone Number</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{patient.phone}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-50">Home Address</p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{patient.address}</p>
                    </div>
                  </div>
                </Card>

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

          {/* Right Column */}
          <div className="space-y-6">
            <Card className="text-center">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6 opacity-50">Primary Physician</h3>
              <div className="flex flex-col items-center">
                <div className="size-20 rounded-full ring-4 ring-[var(--primary-light)] p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--primary)] font-black text-xl">
                    MD
                  </div>
                </div>
                <h4 className="text-lg font-bold text-[var(--text-primary)]">Unassigned</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-6">General Medicine</p>
                <div className="flex gap-2 w-full">
                  <button className="flex-1 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors">
                    <Clock className="size-5 mx-auto" />
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4 opacity-50">Clinical Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-tighter">Allergies</p>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">None Recorded</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-start gap-3">
                  <Info className="size-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-tighter">Notice</p>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">New Patient</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PatientProfilePage;
