'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { pharmacyService } from '@/services/pharmacyService';
import { PatientResponse, AppointmentResponse, PrescriptionResponse } from '@/types/api';
import { formatToken } from '@/utils/tokenHelper';

// --- Sub-components for better complexity management ---

const SearchHeader = ({ activeView, setActiveView, searchTerm, setSearchTerm, handleSearch }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    <div className="lg:col-span-8">
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center">
        <div className="flex items-center gap-2 mr-4 px-2">
          <button 
            onClick={() => setActiveView('APPOINTMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'APPOINTMENTS' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Visits
          </button>
          <button 
            onClick={() => setActiveView('PATIENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeView === 'PATIENTS' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Patients
          </button>
        </div>
        <form onSubmit={handleSearch} className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-orange-600/20 transition-all font-bold text-sm outline-none" 
            placeholder={activeView === 'APPOINTMENTS' ? "Search by patient name, ID..." : "Search patients..."} 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>
    </div>
  </div>
);

const AppointmentsTable = ({ appointments, loading, onSelect }: { appointments: AppointmentResponse[], loading: boolean, onSelect: (id: string) => void }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <th className="px-6 py-4">Appt Date</th>
        <th className="px-6 py-4">Time</th>
        <th className="px-6 py-4">Slot</th>
        <th className="px-6 py-4">Patient</th>
        <th className="px-6 py-4">Token</th>
        <th className="px-6 py-4 text-center">Status</th>
        <th className="px-6 py-4 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {loading ? (
        <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic font-medium">Retrieving medical history...</td></tr>
      ) : appointments.length === 0 ? (
        <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic font-medium">No visit history found.</td></tr>
      ) : appointments.map((row) => (
        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelect(row.patientId)}>
          <td className="px-6 py-5 font-bold text-slate-900 text-sm">
            {new Date(row.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>
          <td className="px-6 py-5 font-bold text-slate-700 text-sm">
            {new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </td>
          <td className="px-6 py-5">
             <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase">
               {row.timeSlot || 'N/A'}
             </span>
          </td>
          <td className="px-6 py-5">
            <p className="font-bold text-slate-900 text-sm">{row.patientName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {row.patientId?.substring(0, 8)}</p>
          </td>
          <td className="px-6 py-5">
             <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
               {formatToken(row)}
             </span>
          </td>
          <td className="px-6 py-5 text-center">
             <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-green-50 text-green-700 border border-green-100">
               {row.status}
             </span>
          </td>
          <td className="px-6 py-5 text-center">
            <button className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all border border-orange-100">
              View Record
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const PatientsTable = ({ patients, loading, onSelect }: { patients: PatientResponse[], loading: boolean, onSelect: (id: string) => void }) => (
  <table className="w-full text-left">
    <thead>
      <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <th className="px-6 py-4">Patient ID</th>
        <th className="px-6 py-4">Patient Profile</th>
        <th className="px-6 py-4 text-center">Gender</th>
        <th className="px-6 py-4 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-50">
      {loading ? (
        <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-medium">Retrieving electronic health records...</td></tr>
      ) : patients.length === 0 ? (
        <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-medium">No patient records found.</td></tr>
      ) : patients.map((row) => (
        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelect(row.id)}>
          <td className="px-6 py-5">
            <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
              #PAT-{row.id.toString().substring(0, 5)}
            </span>
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border-2 border-white shadow-sm">
                {row.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.fullName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.phone}</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-5 text-center font-bold text-xs text-slate-600 capitalize">
            {row.gender.toLowerCase()}
          </td>
          <td className="px-6 py-5 text-center">
            <button className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition-all border border-orange-100">
              View History
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const MedicalHistoryPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [historyAppointments, setHistoryAppointments] = useState<AppointmentResponse[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'APPOINTMENTS' | 'PATIENTS'>('APPOINTMENTS');

  const fetchHistory = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const res = await appointmentService.list(0, 50, search, undefined, undefined, 'COMPLETED');
      if (res.success && res.data) setHistoryAppointments(res.data.content);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const res = await patientService.list(0, 20, search);
      if (res.success && res.data) setPatients(res.data.content);
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
      }

      if (aRes.status === 'fulfilled' && aRes.value.success && aRes.value.data) {
        const patientAppointments = aRes.value.data.content
          .filter(a => a.patientId === id)
          .toSorted((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime());
        setAppointments(patientAppointments);
        if (patientAppointments.length > 0) setSelectedAppointment(patientAppointments[0]);
      }

      if (prRes.status === 'fulfilled' && prRes.value.success && prRes.value.data && Array.isArray(prRes.value.data.content)) {
        setPrescriptions(prRes.value.data.content.filter(p => p.patientId === id));
      } else {
        setPrescriptions([]);
      }
    } catch (error) {
      console.error('Failed to fetch patient details', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    } else if (activeView === 'APPOINTMENTS') {
      fetchHistory();
    } else {
      fetchPatients();
    }
  }, [patientId, activeView, fetchHistory, fetchPatients, fetchPatientDetails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeView === 'APPOINTMENTS') fetchHistory(searchTerm);
    else fetchPatients(searchTerm);
  };

  const selectPatient = (id: string) => {
    router.push(`/doctor/history?patientId=${id}`);
  };

  if (!patientId) {
    return (
      <MainLayout title="Medical History" hideTitle>
        <div className="p-8 max-w-[1600px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="font-manrope text-3xl font-black text-slate-900 tracking-tight uppercase">Medical History</h2>
              <p className="text-slate-500 font-medium mt-1">Review past consultations and patient records.</p>
            </div>
          </div>

          <SearchHeader 
            activeView={activeView} setActiveView={setActiveView} 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
            handleSearch={handleSearch} 
          />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
            <div className="overflow-x-auto">
              {activeView === 'APPOINTMENTS' ? (
                <AppointmentsTable appointments={historyAppointments} loading={loading} onSelect={selectPatient} />
              ) : (
                <PatientsTable patients={patients} loading={loading} onSelect={selectPatient} />
              )}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patient Medical History" hideTitle>
      <div className="h-screen -m- gutter flex flex-col bg-surface overflow-hidden">
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

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-gray-200 bg-surface-container-low overflow-y-auto shrink-0">
            <div className="p-6">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">Visit Timeline</h3>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                {appointments.map((apt) => (
                  <div key={apt.id} className="relative pl-8 group cursor-pointer" onClick={() => setSelectedAppointment(apt)}>
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
                        {selectedAppointment?.id === apt.id && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">Selected</span>}
                      </div>
                      <p className="font-headline-sm text-headline-sm text-on-surface">Consultation</p>
                      <p className="font-body-sm text-body-sm text-gray-500">{apt.timeSlot} • Dr. {apt.doctorName}</p>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && !loading && <p className="text-gray-500 italic pl-8">No previous visits found.</p>}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {selectedAppointment ? (
                <>
                  <div className="mb-10 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b border-outline-variant flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">event_note</span>
                        <h2 className="font-headline-md text-headline-md text-on-surface">
                          Visit Summary: {new Date(selectedAppointment.appointmentTime).toLocaleDateString()}
                        </h2>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase">{selectedAppointment.status}</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                      <div className="md:col-span-4">
                        <p className="text-gray-500 font-label-sm text-label-sm mb-2 uppercase tracking-wider">Chief Complaint</p>
                        <p className="font-body-lg text-body-lg text-on-surface">{selectedAppointment.notes || 'Routine checkup.'}</p>
                      </div>
                      <div className="md:col-span-6">
                        <p className="text-gray-500 font-label-sm text-label-sm mb-2 uppercase tracking-wider">Vitals & Measurements</p>
                        <div className="flex flex-wrap gap-4 items-center mt-1">
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[18px]">favorite</span>
                            <span className="font-manrope font-bold text-sm text-on-surface">{selectedAppointment.vitals?.heartRate || '--'} bpm</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="material-symbols-outlined text-blue-500 text-[18px]">device_thermostat</span>
                            <span className="font-manrope font-bold text-sm text-on-surface">{selectedAppointment.vitals?.temperature || '--'}°</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="material-symbols-outlined text-green-500 text-[18px]">blood_pressure</span>
                            <span className="font-manrope font-bold text-sm text-on-surface">{selectedAppointment.vitals?.bloodPressure || '--'}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="material-symbols-outlined text-cyan-500 text-[18px]">pulse_alert</span>
                            <span className="font-manrope font-bold text-sm text-on-surface">{selectedAppointment.vitals?.oxygenLevel || '--'}%</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="material-symbols-outlined text-orange-500 text-[18px]">weight</span>
                            <span className="font-manrope font-bold text-sm text-on-surface">{selectedAppointment.vitals?.weight || '--'} kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-500 font-label-sm text-label-sm mb-2 uppercase tracking-wider">Consultation Time</p>
                        <p className="font-body-lg text-body-lg text-on-surface">{selectedAppointment.timeSlot || new Date(selectedAppointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-7 bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-orange-600">clinical_notes</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">Diagnosis & Notes</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
                          <p className="font-label-sm text-label-sm text-gray-500 mb-1 uppercase tracking-widest text-[10px]">Assessment / Diagnosis</p>
                          <p className="font-headline-sm text-headline-sm text-on-surface">{selectedAppointment.notes ? selectedAppointment.notes.split('.')[0] : 'Stable condition.'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <p className="text-xs font-bold text-slate-400 uppercase mb-2">Clinical Notes</p>
                           <p className="font-body-md text-body-md text-gray-700 leading-relaxed">{selectedAppointment.notes || 'No detailed clinical notes provided for this visit.'}</p>
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
