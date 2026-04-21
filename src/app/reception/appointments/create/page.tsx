'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { PatientResponse, DoctorResponse, CreateAppointmentRequest } from '@/types/api';
import { Search, Calendar, User, UserRound, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AppointmentBookingPage = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    notes: ''
  });

  const [searchPatient, setSearchPatient] = useState('');
  const [selectedDoctorObj, setSelectedDoctor] = useState<DoctorResponse | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [patRes, docRes] = await Promise.all([
        patientService.list(0, 50),
        doctorService.list(0, 50)
      ]);
      if (patRes.success && patRes.data) setPatients(patRes.data.content);
      if (docRes.success && docRes.data) setDoctors(docRes.data.content);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDoctorChange = (id: string) => {
    setFormData({ ...formData, doctorId: id });
    setSelectedDoctor(doctors.find(d => d.id === Number(id)) || null);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.time) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const appointmentTime = `${formData.date}T${formData.time}:00`;
      const request: CreateAppointmentRequest = {
        patientId: Number(formData.patientId),
        doctorId: Number(formData.doctorId),
        appointmentTime,
        notes: formData.notes
      };

      const res = await appointmentService.create(request);
      if (res.success) {
        router.push('/reception/appointments');
      }
    } catch (error) {
      console.error('Booking failed', error);
    }
  };

  // Mock available timeslots
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchPatient.toLowerCase()) || 
    p.id.toString().includes(searchPatient)
  );

  return (
    <MainLayout title="Book Appointment">
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-[1440px] mx-auto w-full">
        <aside className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-[var(--surface)] p-6 rounded-xl shadow-sm border border-[var(--border)]">
            <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Book New Appointment</h3>
            <form onSubmit={handleBooking} className="flex flex-col gap-4">
              <FormField label="Search Patient" required>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-secondary)]" />
                  <input 
                    className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none" 
                    placeholder="Name or Patient ID" 
                    type="text"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>
                {searchPatient && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-[var(--border)] rounded-lg bg-[var(--background)]">
                    {filteredPatients.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, patientId: p.id.toString() });
                          setSearchPatient(p.fullName);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--primary-light)] border-b border-[var(--border)] last:border-0"
                      >
                        {p.fullName} (#PAT-{p.id})
                      </button>
                    ))}
                  </div>
                )}
              </FormField>

              <FormField label="Select Doctor" required>
                <select 
                  className="form-input text-sm"
                  value={formData.doctorId}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  required
                >
                  <option value="">Select a Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Preferred Date" required>
                <input 
                  type="date" 
                  className="form-input text-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </FormField>

              <div className="pt-2">
                <button 
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2" 
                  type="submit"
                >
                  <Calendar className="size-4" />
                  Book Appointment
                </button>
              </div>
            </form>
          </div>

          {selectedDoctorObj && (
            <div className="bg-[var(--surface)] p-6 rounded-xl shadow-sm border border-[var(--border)] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black">
                  {selectedDoctorObj.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)]">{selectedDoctorObj.fullName}</h4>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedDoctorObj.specialization}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Department</span>
                  <span className="text-[var(--text-primary)] font-medium">{selectedDoctorObj.department || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className="text-green-600 font-bold">AVAILABLE</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <Card className="flex flex-col h-full overflow-hidden p-0">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]/50">
              <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Select Appointment Slot</h2>
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-bold">
                <Clock className="size-4" />
                {new Date(formData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {timeSlots.map(slot => (
                  <button 
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, time: slot })}
                    className={`py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                      formData.time === slot
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg scale-105'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--border)]">
                <FormField label="Additional Notes (Optional)">
                  <textarea 
                    className="form-input min-h-[100px] resize-none"
                    placeholder="Briefly describe the purpose of the visit..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </FormField>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </MainLayout>
  );
};

export default AppointmentBookingPage;
