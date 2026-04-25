'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { DoctorResponse, PatientResponse, AppointmentResponse } from '@/types/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Search, 
  Plus, 
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

const CreateAppointmentPage = ({ params: _params }: { params: Promise<any> }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId');
  const initialDoctorId = searchParams.get('doctorId');

  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const debouncedPatientSearch = useDebounce(searchPatient, 300);
  const debouncedDoctorSearch = useDebounce(searchDoctor, 300);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const docRes = await doctorService.list(0, 500);
      if (docRes.success && docRes.data) {
        setDoctors(docRes.data.content);
        if (initialDoctorId) {
          const doc = docRes.data.content.find(d => d.id === initialDoctorId);
          if (doc) {
            selectDoctor(doc);
          }
        }
      }

      if (initialPatientId) {
        const patRes = await patientService.get(initialPatientId);
        if (patRes.success && patRes.data) {
          selectPatient(patRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [initialDoctorId, initialPatientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch booked slots when doctor or date changes
  useEffect(() => {
    if (!formData.doctorId || !formData.date) return;
    appointmentService.list(0, 500, selectedDoctor?.fullName).then(res => {
      if (res.success && res.data) {
        const booked = res.data.content
          .filter(a => a.doctorId === formData.doctorId && a.appointmentTime.startsWith(formData.date))
          .map(a => a.appointmentTime.split('T')[1].substring(0, 5));
        setBookedSlots(booked);

        if (selectedPatient) {
          const hasDup = res.data.content.some(a => 
            a.patientId === selectedPatient.id && 
            a.doctorId === formData.doctorId && 
            a.appointmentTime.startsWith(formData.date) && 
            a.status !== 'CANCELLED'
          );
          setWarning(hasDup ? 'Patient already has an appointment with this doctor on this date.' : null);
        }
      }
    });
  }, [formData.doctorId, formData.date, selectedDoctor, selectedPatient]);

  const selectPatient = (p: PatientResponse) => {
    setSelectedPatient(p);
    setFormData(prev => ({ ...prev, patientId: p.id }));
    setSearchPatient('');
  };

  const selectDoctor = (d: DoctorResponse) => {
    setSelectedDoctor(d);
    setFormData(prev => ({ ...prev, doctorId: d.id }));
    setSearchDoctor('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.date || !formData.time) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await appointmentService.create({
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        appointmentTime: `${formData.date}T${formData.time}:00`,
        notes: formData.notes
      });
      if (res.success) {
        router.push('/reception/appointments');
      }
    } catch (error) {
      console.error('Failed to create appointment', error);
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  if (loading) return <MainLayout title="Loading..."><div className="p-8">Initializing...</div></MainLayout>;

  return (
    <MainLayout title="New Appointment" hideTitle>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4 -mt-10 mb-2">
           <Link href="/reception/appointments" className="p-2 hover:bg-[var(--primary-light)] rounded-xl transition-all">
             <ArrowLeft className="size-5 text-[var(--text-secondary)]" />
           </Link>
           <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter">Schedule Appointment</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Patient Selection */}
            <Card className="relative overflow-hidden border-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">1</div>
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Select Patient</h3>
              </div>

              {selectedPatient ? (
                <div className="flex items-center justify-between p-4 bg-[var(--primary-light)]/30 rounded-2xl border-2 border-[var(--primary)] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black text-xl">
                      {selectedPatient.fullName[0]}
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-primary)]">{selectedPatient.fullName}</p>
                      <p className="text-xs font-bold text-[var(--text-secondary)]">ID: #PAT-{selectedPatient.id.toString().slice(-5).toUpperCase()}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setSelectedPatient(null); setFormData(f => ({...f, patientId: ''})); }}
                    className="p-2 hover:bg-white rounded-lg text-red-500 transition-all"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                  <input 
                    className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-2xl focus:border-[var(--primary)] outline-none transition-all font-bold"
                    placeholder="Search by Patient Name or Phone..."
                    value={searchPatient}
                    onChange={e => setSearchPatient(e.target.value)}
                  />
                  {debouncedPatientSearch.length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[var(--border)] rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto p-2">
                       {/* Search results placeholder - would call patientService.list */}
                       <div className="p-4 text-center text-xs font-bold text-gray-400">Searching patients...</div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Step 2: Doctor Selection */}
            <Card className="border-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">2</div>
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Select Doctor</h3>
              </div>

              {selectedDoctor ? (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                      <Stethoscope className="size-6" />
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-primary)]">{selectedDoctor.fullName}</p>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => { setSelectedDoctor(null); setFormData(f => ({...f, doctorId: ''})); }}
                    className="p-2 hover:bg-white rounded-lg text-red-500 transition-all"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.slice(0, 4).map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => selectDoctor(doc)}
                      className="flex items-center gap-4 p-4 border-2 border-[var(--border)] rounded-2xl hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/30 transition-all text-left"
                    >
                      <div className="size-10 rounded-xl bg-white border border-[var(--border)] flex items-center justify-center text-purple-600 font-black">
                        {doc.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)] text-sm">{doc.fullName}</p>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{doc.specialization}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Step 3: Schedule */}
            <Card className="border-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">3</div>
                <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Choose Slot</h3>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                  <input 
                    type="date"
                    className="w-full pl-12 pr-4 py-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-2xl focus:border-[var(--primary)] outline-none transition-all font-bold"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {timeSlots.map(t => {
                    const isBooked = bookedSlots.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setFormData({...formData, time: t})}
                        className={`py-3 rounded-xl font-black text-xs transition-all border-2 ${
                          formData.time === t 
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20' 
                          : isBooked 
                            ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                            : 'bg-white border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 sticky top-24">
              <h3 className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6 opacity-50 text-center">Summary</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1 p-4 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                   <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Patient</p>
                   <p className="font-bold text-sm">{selectedPatient?.fullName || 'Not Selected'}</p>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                   <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Doctor</p>
                   <p className="font-bold text-sm">{selectedDoctor?.fullName || 'Not Selected'}</p>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                   <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Date & Time</p>
                   <p className="font-bold text-sm">{formData.date} at {formData.time || '--:--'}</p>
                </div>

                {warning && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold leading-snug">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                )}

                <textarea 
                  className="w-full p-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-2xl focus:border-[var(--primary)] outline-none transition-all font-bold text-sm min-h-[100px]"
                  placeholder="Notes (optional)..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>

                <button 
                  type="submit"
                  disabled={submitting || !formData.patientId || !formData.doctorId || !formData.time}
                  className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                >
                  {submitting ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateAppointmentPage;
