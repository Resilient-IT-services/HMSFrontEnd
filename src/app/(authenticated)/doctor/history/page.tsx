'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { pharmacyService } from '@/services/pharmacyService';
import { PatientResponse, AppointmentResponse, PrescriptionResponse } from '@/types/api';
import { Card } from '@/components/ui/Card';

const MedicalHistoryPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPatients = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const res = await patientService.list(0, 20, search);
      if (res.success && res.data) {
        setPatients(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch patients', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientDetails = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const [pRes, aRes, prRes] = await Promise.allSettled([
        patientService.get(id),
        appointmentService.list(0, 100),
        pharmacyService.listPrescriptions()
      ]);

      if (pRes.status === 'fulfilled' && pRes.value.success && pRes.value.data) {
        setSelectedPatient(pRes.value.data);
      } else {
        console.error('Failed to fetch patient info:', pRes.status === 'rejected' ? pRes.reason : pRes.value);
      }

      if (aRes.status === 'fulfilled' && aRes.value.success && aRes.value.data) {
        const patientAppointments = aRes.value.data.content
          .filter(a => a.patientId === id)
          .toSorted((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime());
        setAppointments(patientAppointments);
        if (patientAppointments.length > 0) {
          setSelectedAppointment(patientAppointments[0]);
        }
      } else {
        console.error('Failed to fetch appointments:', aRes.status === 'rejected' ? aRes.reason : aRes.value);
      }

      if (prRes.status === 'fulfilled' && prRes.value.success && prRes.value.data && Array.isArray(prRes.value.data.content)) {
        setPrescriptions(prRes.value.data.content.filter(p => p.patientId === id));
      } else {
        console.error('Failed to fetch prescriptions for history:', prRes.status === 'rejected' ? prRes.reason : prRes.value);
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch patient details (unexpected error):', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    } else {
      fetchPatients();
    }
  }, [patientId, fetchPatients, fetchPatientDetails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(searchTerm);
  };

  const selectPatient = (id: string) => {
    router.push(`/doctor/history?patientId=${id}`);
  };

  if (!patientId) {
    return (
      <MainLayout title="Medical History">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <h2 className="text-xl font-bold mb-4">Search Patient History</h2>
            <form onSubmit={handleSearch} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Search by name, ID or phone..." 
                className="flex-1 p-3 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-700 transition-colors">
                Search
              </button>
            </form>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map(p => (
                <div key={p.id} onClick={() => selectPatient(p.id)}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-primary font-bold">
                        {p.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{p.fullName}</h3>
                        <p className="text-xs text-gray-500">
                          ID: #PAT-{p.id.substring(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
            ))}
            {patients.length === 0 && !loading && (
              <p className="text-gray-500 italic col-span-2 text-center py-8">No patients found. Try searching.</p>
            )}
            {loading && <p className="text-gray-500 italic col-span-2 text-center py-8">Loading...</p>}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patient Medical History" hideTitle>
      <div className="h-screen -m- gutter flex flex-col bg-surface overflow-hidden">
        {/* Secondary Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/doctor/history')}
              className="p-2 hover:bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-gray-600">arrow_back</span>
            </button>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface">{selectedPatient?.fullName || 'Loading...'}</h1>
              <p className="font-body-sm text-body-sm text-gray-500">
                Patient ID: #PAT-{selectedPatient?.id.substring(0, 8).toUpperCase() || '...'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-sm">print</span>
              Print EMR
            </button>
            <button 
              onClick={() => router.push('/doctor/active-consultation')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-label-md text-label-md rounded-lg hover:bg-orange-700 transition-colors"
            >
              Return to Consultation
            </button>
          </div>
        </div>

        {/* Dual Pane Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Timeline */}
          <div className="w-1/3 border-r border-gray-200 bg-surface-container-low overflow-y-auto shrink-0">
            <div className="p-6">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">Visit Timeline</h3>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                {appointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="relative pl-8 group cursor-pointer"
                    onClick={() => setSelectedAppointment(apt)}
                  >
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-colors ${
                      selectedAppointment?.id === apt.id ? 'bg-primary' : 'bg-gray-300 group-hover:bg-primary/50'
                    }`}></div>
                    <div className={`p-4 bg-white border rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 ${
                      selectedAppointment?.id === apt.id ? 'border-2 border-primary' : 'border-outline-variant hover:shadow-md hover:border-primary/30'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`font-label-md text-label-md ${selectedAppointment?.id === apt.id ? 'text-primary' : 'text-gray-500'}`}>
                          {new Date(apt.appointmentTime).toLocaleDateString()}
                        </p>
                        {selectedAppointment?.id === apt.id && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">Selected</span>
                        )}
                      </div>
                      <p className="font-headline-sm text-headline-sm text-on-surface">Consultation</p>
                      <p className="font-body-sm text-body-sm text-gray-500">Dr. {apt.doctorName} • {apt.doctorSpecialization || 'General'}</p>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && !loading && (
                  <p className="text-gray-500 italic pl-8">No previous visits found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Visit Detail */}
          <div className="flex-1 bg-white overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {selectedAppointment ? (
                <>
                  {/* Visit Summary Card */}
                  <div className="mb-10 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">event_note</span>
                        <h2 className="font-headline-md text-headline-md text-on-surface">
                          Visit Summary: {new Date(selectedAppointment.appointmentTime).toLocaleDateString()}
                        </h2>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase">
                        {selectedAppointment.status}
                      </span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-gray-500 font-label-sm text-label-sm mb-1 uppercase tracking-wider">Chief Complaint</p>
                        <p className="font-body-lg text-body-lg text-on-surface">{selectedAppointment.notes || 'Routine checkup.'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-label-sm text-label-sm mb-1 uppercase tracking-wider">Vitals</p>
                        <p className="font-body-lg text-body-lg text-on-surface">BP: 120/80 • HR: 72 • Temp: 98.6°F</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-label-sm text-label-sm mb-1 uppercase tracking-wider">Time</p>
                        <p className="font-body-lg text-body-lg text-on-surface">
                          {new Date(selectedAppointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Sections */}
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-7 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-orange-600">clinical_notes</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Diagnosis & Notes</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                          <p className="font-label-sm text-label-sm text-gray-500 mb-1 uppercase tracking-widest text-[10px]">Assessment / Diagnosis</p>
                          <p className="font-headline-sm text-headline-sm text-on-surface">
                            {selectedAppointment.notes ? selectedAppointment.notes.split('.')[0] : 'Stable condition.'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <p className="text-xs font-bold text-slate-400 uppercase mb-2">Clinical Notes</p>
                           <p className="font-body-md text-body-md text-gray-700 leading-relaxed">
                            {selectedAppointment.notes || 'No detailed clinical notes provided for this visit.'}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-orange-600">medication</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Prescriptions</h3>
                      </div>
                      <div className="space-y-4">
                        {prescriptions.length > 0 ? (
                          <div className="space-y-3">
                            {prescriptions.map((pr) => (
                              <div key={pr.id} className="bg-white p-3 rounded-lg border border-outline-variant">
                                <div className="flex justify-between items-start mb-2">
                                  <p className="font-bold text-sm text-slate-900">{pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : 'N/A'}</p>
                                  <span className="text-[10px] font-black text-orange-600 uppercase bg-orange-50 px-1.5 py-0.5 rounded tracking-widest">Active</span>
                                </div>
                                <div className="space-y-2">
                                  {pr.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                      <span className="font-medium text-slate-700">{item.medicineName}</span>
                                      <span className="text-slate-500">{item.dosage} • {item.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic text-sm">No prescriptions recorded for this patient.</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-12 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-orange-600">attachment</span>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface">Attachments & Imaging</h3>
                        </div>
                      </div>
                      <p className="text-gray-500 italic text-sm">No attachments found.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                  <p>No visit details available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MedicalHistoryPage;
