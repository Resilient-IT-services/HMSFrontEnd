'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { PatientResponse, DoctorResponse, CreateAppointmentRequest } from '@/types/api';
import { Search, Calendar, User, UserPlus, Clock, CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { PatientRegistrationModal } from '@/components/reception/PatientRegistrationModal';

const AppointmentBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDoctorId = searchParams.get('doctorId');
  const initialPatientId = searchParams.get('patientId');

  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegModal, setShowRegModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientId: initialPatientId || '',
    doctorId: initialDoctorId || '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: ''
  });

  // Patient Search State
  const [searchPatient, setSearchPatient] = useState('');
  const debouncedPatientSearch = useDebounce(searchPatient, 300);
  const [patientResults, setPatientResults] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [patientIndex, setPatientIndex] = useState(-1);

  // Doctor Search State
  const [searchDoctor, setSearchDoctor] = useState('');
  const debouncedDoctorSearch = useDebounce(searchDoctor, 300);
  const [doctorResults, setDoctorResults] = useState<DoctorResponse[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResponse | null>(null);
  const [doctorIndex, setDoctorIndex] = useState(-1);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [timeIndex, setTimeIndex] = useState(-1);

  const patientInputRef = useRef<HTMLInputElement>(null);
  const doctorInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const docRes = await doctorService.list(0, 500);
      if (docRes.success && docRes.data) {
        setDoctors(docRes.data.content);
        if (initialDoctorId) {
          const doc = docRes.data.content.find(d => d.id === Number(initialDoctorId));
          if (doc) {
            selectDoctor(doc);
          }
        }
      }

      if (initialPatientId) {
        const patRes = await patientService.get(Number(initialPatientId));
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

  // Patient Search Effect
  useEffect(() => {
    if (debouncedPatientSearch.length < 2 || selectedPatient) {
      setPatientResults([]);
      return;
    }
    patientService.list(0, 10, debouncedPatientSearch).then(res => {
      if (res.success && res.data) setPatientResults(res.data.content);
    });
  }, [debouncedPatientSearch, selectedPatient]);

  // Doctor Search Effect
  useEffect(() => {
    if (debouncedDoctorSearch.length < 1 || selectedDoctor) {
      setDoctorResults([]);
      return;
    }
    const filtered = doctors.filter(d => 
      d.fullName.toLowerCase().includes(debouncedDoctorSearch.toLowerCase()) ||
      d.specialization.toLowerCase().includes(debouncedDoctorSearch.toLowerCase())
    ).slice(0, 10);
    setDoctorResults(filtered);
  }, [debouncedDoctorSearch, selectedDoctor, doctors]);

  // Slots Effect
  useEffect(() => {
    if (!formData.doctorId || !formData.date) return;
    appointmentService.list(0, 500, selectedDoctor?.fullName).then(res => {
      if (res.success && res.data) {
        const booked = res.data.content
          .filter(a => a.doctorId === Number(formData.doctorId) && a.appointmentTime.startsWith(formData.date))
          .map(a => a.appointmentTime.split('T')[1].substring(0, 5));
        setBookedSlots(booked);

        if (selectedPatient) {
          const hasDup = res.data.content.some(a => 
            a.patientId === Number(selectedPatient.id) && 
            a.doctorId === Number(formData.doctorId) && 
            a.appointmentTime.startsWith(formData.date) &&
            a.status !== 'CANCELLED'
          );
          setWarning(hasDup ? 'Patient already has an appointment with this doctor on this date.' : null);
        }
      }
    });
  }, [formData.doctorId, formData.date, selectedPatient, selectedDoctor]);

  const selectPatient = (p: PatientResponse) => {
    const age = calculateAge(p.dob);
    const genderInitial = p.gender === 'MALE' ? 'M' : p.gender === 'FEMALE' ? 'F' : 'O';
    const displayValue = `${p.fullName} (${age}/${genderInitial} PAT-${p.id.toString().padStart(4, '0')})`;
    
    setSelectedPatient(p);
    setSearchPatient(displayValue);
    setFormData(prev => ({ ...prev, patientId: p.id.toString() }));
    setPatientResults([]);
    doctorInputRef.current?.focus();
  };

  const selectDoctor = (d: DoctorResponse) => {
    const displayValue = `${d.fullName} (${d.specialization})`;
    setSelectedDoctor(d);
    setSearchDoctor(displayValue);
    setFormData(prev => ({ ...prev, doctorId: d.id.toString() }));
    setDoctorResults([]);
    dateInputRef.current?.focus();
  };

  const handleBooking = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.time) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await appointmentService.create({
        patientId: Number(formData.patientId),
        doctorId: Number(formData.doctorId),
        appointmentTime: `${formData.date}T${formData.time}:00`,
        notes: formData.notes
      });
      if (res.success) {
        router.push('/reception/appointments');
      }
    } catch (error) {
      console.error('Booking failed', error);
    }
  };

  // DOB Logic
  const parseFlexibleDate = (input: string) => {
    const clean = input.replace(/\D/g, '');
    let day, month, year;
    if (clean.length === 6) {
      day = clean.slice(0, 2); month = clean.slice(2, 4); year = clean.slice(4, 6);
      year = parseInt(year) > (new Date().getFullYear() % 100) ? `19${year}` : `20${year}`;
    } else if (clean.length === 8) {
      day = clean.slice(0, 2); month = clean.slice(2, 4); year = clean.slice(4, 8);
    } else return null;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parsed = parseFlexibleDate(formData.date);
      if (parsed) {
        setFormData(prev => ({ ...prev, date: parsed }));
        // Move to time slots
        setTimeIndex(0);
      }
    }
  };

  const handleDateBlur = () => {
    const parsed = parseFlexibleDate(formData.date);
    if (parsed) {
      setFormData(prev => ({ ...prev, date: parsed }));
    }
  };

  const selectTime = (slot: string) => {
    if (!bookedSlots.includes(slot)) {
      setFormData(prev => ({ ...prev, time: slot }));
      // Focus next field (notes)
      setTimeout(() => notesInputRef.current?.focus(), 100);
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setTimeIndex(prev => Math.min(prev + 1, timeSlots.length - 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setTimeIndex(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setTimeIndex(prev => Math.min(prev + 4, timeSlots.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setTimeIndex(prev => Math.max(prev - 4, 0)); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const slot = timeSlots[timeIndex];
      selectTime(slot);
    }
  };

  return (
    <MainLayout title="Book Appointment">
      <div className="flex flex-col lg:flex-row items-stretch gap-8">
        <aside className="w-full lg:w-1/2 flex flex-col">
          <Card className="border-2 border-[var(--primary)] p-8 h-full flex flex-col">
            <h3 className="text-lg font-black mb-6 text-[var(--text-primary)] uppercase tracking-tight">Book New Appointment</h3>
            <form onSubmit={handleBooking} className="flex flex-col gap-5 flex-1">
              
              {/* Patient Search */}
              <FormField label="Patient Name / Phone" required>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)] z-10" />
                  <input 
                    ref={patientInputRef}
                    className="form-input !pl-10 !pr-10 font-bold" 
                    placeholder="Search by Name or Patient ID or Phone..." 
                    type="text"
                    value={searchPatient}
                    onChange={(e) => {
                      setSearchPatient(e.target.value);
                      if (selectedPatient) setSelectedPatient(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setPatientIndex(prev => Math.min(prev + 1, patientResults.length)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setPatientIndex(prev => Math.max(prev - 1, -1)); }
                      else if (e.key === 'Enter' && patientIndex >= 0) {
                        e.preventDefault();
                        if (patientIndex < patientResults.length) selectPatient(patientResults[patientIndex]);
                        else setShowRegModal(true);
                      }
                    }}
                  />
                  {selectedPatient && (
                    <button 
                      type="button" 
                      onClick={() => { setSelectedPatient(null); setSearchPatient(''); patientInputRef.current?.focus(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] z-10"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                  {searchPatient && !selectedPatient && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                      {patientResults.map((p, i) => (
                        <button key={p.id} type="button" onClick={() => selectPatient(p)} className={`w-full text-left p-3 flex justify-between items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--primary-light)] ${patientIndex === i ? 'bg-[var(--primary-light)]' : ''}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{p.fullName}</span>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">#PAT-{p.id} • {p.phone}</span>
                          </div>
                          <ChevronRight className="size-4 opacity-30" />
                        </button>
                      ))}
                      <button type="button" onClick={() => setShowRegModal(true)} className={`w-full p-3 flex items-center gap-2 text-[var(--primary)] font-black text-xs bg-[var(--background)] border-t-2 border-[var(--border)] hover:bg-[var(--primary-light)] ${patientIndex === patientResults.length ? 'bg-[var(--primary-light)]' : ''}`}>
                        <UserPlus className="size-4" />
                        CREATE NEW PATIENT
                      </button>
                    </div>
                  )}
                </div>
              </FormField>

              {/* Doctor Search */}
              <FormField label="Doctor Name / Specialization" required>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)] z-10" />
                  <input 
                    ref={doctorInputRef}
                    className="form-input !pl-10 !pr-10 font-bold" 
                    placeholder="Search doctor..." 
                    type="text"
                    value={searchDoctor}
                    onChange={(e) => {
                      setSearchDoctor(e.target.value);
                      if (selectedDoctor) setSelectedDoctor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setDoctorIndex(prev => Math.min(prev + 1, doctorResults.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setDoctorIndex(prev => Math.max(prev - 1, -1)); }
                      else if (e.key === 'Enter' && doctorIndex >= 0) {
                        e.preventDefault();
                        selectDoctor(doctorResults[doctorIndex]);
                      }
                    }}
                  />
                  {selectedDoctor && (
                    <button 
                      type="button" 
                      onClick={() => { setSelectedDoctor(null); setSearchDoctor(''); doctorInputRef.current?.focus(); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] z-10"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                  {searchDoctor && !selectedDoctor && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                      {doctorResults.map((d, i) => (
                        <button key={d.id} type="button" onClick={() => selectDoctor(d)} className={`w-full text-left p-3 flex justify-between items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--primary-light)] ${doctorIndex === i ? 'bg-[var(--primary-light)]' : ''}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{d.fullName}</span>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{d.specialization}</span>
                          </div>
                          <ChevronRight className="size-4 opacity-30" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>

              {/* Date */}
              <FormField label="Preferred Date" required>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)] z-10" />
                  <input 
                    ref={dateInputRef}
                    type="text" 
                    className="form-input !pl-10 font-bold"
                    placeholder="DDMMYYYY or YYYY-MM-DD"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    onKeyDown={handleDateKeyDown}
                    onBlur={handleDateBlur}
                  />
                </div>
              </FormField>

              {warning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-amber-700">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold uppercase leading-tight">{warning}</p>
                </div>
              )}

              <button 
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2" 
                type="submit"
                disabled={!formData.patientId || !formData.doctorId || !formData.time}
              >
                <CheckCircle className="size-5" />
                BOOK APPOINTMENT
              </button>
            </form>
          </Card>
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <Card className="flex flex-col h-full overflow-hidden p-0 border-2">
            <div className="p-6 border-b-2 border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Select Appointment Slot</h2>
              <div className="flex items-center gap-2 text-[var(--primary)] bg-[var(--primary-light)] px-4 py-2 rounded-full text-sm font-black uppercase">
                <Calendar className="size-4" />
                {new Date(formData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            
            <div className="p-8" tabIndex={0} onKeyDown={handleTimeKeyDown}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 outline-none">
                {timeSlots.map((slot, i) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = formData.time === slot;
                  const isFocused = timeIndex === i;
                  return (
                    <button 
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => selectTime(slot)}
                      className={`py-4 rounded-xl text-sm font-black transition-all border-2 ${
                        isSelected
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xl scale-105'
                        : isBooked
                        ? 'bg-slate-100 text-slate-300 border-slate-50 cursor-not-allowed line-through'
                        : isFocused
                        ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 pt-8 border-t-2 border-[var(--border)]">
                <FormField label="Additional Notes (Optional)">
                  <textarea 
                    ref={notesInputRef}
                    className="form-input min-h-[120px] resize-none font-medium"
                    placeholder="Briefly describe the purpose of the visit..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </FormField>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <PatientRegistrationModal 
        isOpen={showRegModal} 
        onClose={() => setShowRegModal(false)} 
        onSuccess={(p) => {
          if (p) selectPatient(p);
          setShowRegModal(false);
        }}
      />
    </MainLayout>
  );
};

export default AppointmentBookingPage;
