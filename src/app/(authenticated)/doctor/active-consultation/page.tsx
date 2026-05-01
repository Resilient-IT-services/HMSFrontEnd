'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { hospitalService } from '@/services/hospitalService';
import { pharmacyService } from '@/services/pharmacyService';
import { RootState } from '@/state/store';
import { AppointmentResponse, PatientResponse, HospitalResponse, PrescriptionDTO } from '@/types/api';
import DigitalPrescription from '@/components/doctor/DigitalPrescription';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatToken } from '@/utils/tokenHelper';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';

interface PrescriptionRow {
  id: string;
  medicine: string;
  medicineId?: string;
  frequency: string;
  instructions: string;
}

export default function ActiveConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const { user } = useSelector((state: RootState) => state.auth);

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [hospital, setHospital] = useState<HospitalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  // Form State
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icdCodes, setIcdCodes] = useState<{ code: string; label: string }[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([
    { id: '1', medicine: '', frequency: '', instructions: '' },
    { id: '2', medicine: '', frequency: '', instructions: '' },
    { id: '3', medicine: '', frequency: '', instructions: '' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!appointmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await appointmentService.get(appointmentId);
        if (res.success && res.data) {
          const found = res.data;
          setAppointment(found);
          setComplaint(found.chiefComplaints || found.notes || '');
          setDiagnosis(found.diagnosis || '');
          
          const pRes = await patientService.get(found.patientId);
          if (pRes.success && pRes.data) {
            setPatient(pRes.data);
          }

          const hospitalId = user?.currentHospitalId || user?.memberships[0]?.hospitalId;
          if (hospitalId) {
            const hRes = await hospitalService.getById(hospitalId);
            if (hRes.success && hRes.data) {
              setHospital(hRes.data);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch consultation data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, user]);

  const patientAge = useMemo(() => {
    if (!patient?.dob) return '--';
    try {
      const birthDate = new Date(patient.dob);
      if (Number.isNaN(birthDate.getTime())) return '--';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.error('Failed to calculate patient age', error);
      return '--';
    }
  }, [patient]);

  const updatePrescription = (index: number, field: keyof PrescriptionRow, value: string, medicineId?: string) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index] = { ...newPrescriptions[index], [field]: value };
    
    if (medicineId) {
      newPrescriptions[index].medicineId = medicineId;
    }
    
    if (index === prescriptions.length - 1 && value !== '') {
      newPrescriptions.push({ id: Math.random().toString(), medicine: '', frequency: '', instructions: '' });
    }
    
    setPrescriptions(newPrescriptions);
  };

  const removeIcdCode = (code: string) => {
    setIcdCodes(icdCodes.filter(c => c.code !== code));
  };

  const handleFinishConsultation = async () => {
    if (!appointmentId || !appointment) return;

    try {
      setFinishing(true);
      
      const validPrescriptions = prescriptions.filter(p => p.medicine.trim() !== '');
      
      if (validPrescriptions.length > 0) {
        const prescriptionData: PrescriptionDTO = {
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id,
          items: validPrescriptions.map(p => ({
            medicineId: p.medicineId,
            medicineName: p.medicine,
            dosage: p.frequency,
            duration: p.instructions
          }))
        };

        const presRes = await pharmacyService.createPrescription(prescriptionData);
        if (!presRes.success) {
          triggerGlobalToast('Failed to save prescription to pharmacy', 'error');
          setFinishing(false);
          return;
        }
      }

      const consultationRes = await appointmentService.updateConsultation(appointmentId, {
        chiefComplaints: complaint,
        diagnosis: diagnosis,
        icdCodes: icdCodes.map(c => c.code),
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentTime: appointment.appointmentTime 
      });

      if (!consultationRes.success) {
        triggerGlobalToast('Failed to save clinical details', 'error');
        setFinishing(false);
        return;
      }

      const statusRes = await appointmentService.updateStatus(appointmentId, { status: 'COMPLETED' });
      
      if (statusRes.success) {
        triggerGlobalToast('Consultation finished successfully', 'success');
        router.push('/doctor/patient-queue');
      } else {
        triggerGlobalToast('Consultation saved but failed to close appointment', 'warning');
      }
    } catch (error) {
      console.error('Failed to finish consultation', error);
      triggerGlobalToast('An error occurred while finishing consultation', 'error');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Active Consultation" hideTitle>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Active Consultation" hideTitle>
      <div className="flex flex-col bg-surface min-h-screen">
        {/* Sticky Mobile-Friendly Header */}
        <div className="bg-white border-b border-outline-variant sticky top-16 z-30 px-4 lg:px-8 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {patient?.fullName?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg lg:text-xl font-bold text-on-surface truncate">{patient?.fullName || 'Unknown Patient'}</h1>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black border border-primary/20 shrink-0">
                    {formatToken(appointment)}
                  </span>
                </div>
                <p className="text-[11px] lg:text-xs text-gray-500 font-medium">
                  {patientAge} yrs • {patient?.gender} • {appointment?.vitals?.weight || '--'} kg • ID: #PAT-{patient?.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0 px-2">
                <span className="material-symbols-outlined text-primary text-[16px]">favorite</span>
                <span className="font-manrope font-bold text-xs">{appointment?.vitals?.heartRate || '--'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 px-2 border-l border-gray-200">
                <span className="material-symbols-outlined text-blue-500 text-[16px]">device_thermostat</span>
                <span className="font-manrope font-bold text-xs">{appointment?.vitals?.temperature || '--'}°</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 px-2 border-l border-gray-200">
                <span className="material-symbols-outlined text-green-500 text-[16px]">blood_pressure</span>
                <span className="font-manrope font-bold text-xs">{appointment?.vitals?.bloodPressure || '--'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 px-2 border-l border-gray-200">
                <span className="material-symbols-outlined text-cyan-500 text-[16px]">pulse_alert</span>
                <span className="font-manrope font-bold text-xs">{appointment?.vitals?.oxygenLevel || '--'}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column: Complaint & Diagnosis */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-outline-variant p-5 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md lg:text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">record_voice_over</span> Chief Complaint
                  </h3>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                    <span className="material-symbols-outlined text-xl">mic</span>
                  </button>
                </div>
                <textarea 
                  className="w-full min-h-[150px] lg:min-h-[200px] p-4 bg-gray-50/50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm leading-relaxed resize-none outline-none" 
                  placeholder="Enter patient symptoms and complaints here..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-2xl border border-outline-variant p-5 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md lg:text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">medical_information</span> Diagnosis
                  </h3>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                    <span className="material-symbols-outlined text-xl">search</span>
                  </button>
                </div>
                <textarea 
                  className="w-full min-h-[150px] lg:min-h-[200px] p-4 bg-gray-50/50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm leading-relaxed resize-none outline-none" 
                  placeholder="Enter final clinical diagnosis and assessment..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {icdCodes.map((icd) => (
                    <span key={icd.code} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold">
                      {icd.code} {icd.label}
                      <span 
                        className="material-symbols-outlined text-[14px] cursor-pointer" 
                        onClick={() => removeIcdCode(icd.code)}
                      >
                        close
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Prescriptions */}
            <div className="bg-white rounded-2xl border border-outline-variant p-5 lg:p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-md lg:text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span> Medication & Rx
                </h3>
              </div>
              
              <div className="flex-1 space-y-6">
                {prescriptions.map((row, index) => (
                  <div key={row.id} className={`flex flex-col gap-4 pb-6 ${index < prescriptions.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="w-full">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Medicine Name</label>
                      <MedicineAutocomplete 
                        defaultValue={row.medicine}
                        onSelect={(med) => updatePrescription(index, 'medicine', med.name, med.id)}
                        placeholder="Search medicine database..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Frequency</label>
                        <select 
                          className="w-full px-3 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-xs lg:text-sm focus:ring-2 focus:ring-primary outline-none"
                          value={row.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                        >
                          <option value="">Select frequency...</option>
                          <option value="3 times a day">3 times a day</option>
                          <option value="2 times a day">2 times a day</option>
                          <option value="Once daily">Once daily</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Instructions</label>
                        <select 
                          className="w-full px-3 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-xs lg:text-sm focus:ring-2 focus:ring-primary outline-none"
                          value={row.instructions}
                          onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        >
                          <option value="">Select instructions...</option>
                          <option value="After lunch">After lunch</option>
                          <option value="Before breakfast">Before breakfast</option>
                          <option value="Before sleep">Before sleep</option>
                          <option value="Empty stomach">Empty stomach</option>
                          <option value="For acute spasms">For acute spasms</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => setShowPrescription(true)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-[10px] lg:text-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span> Generate Rx
                </button>
                <button 
                  onClick={handleFinishConsultation}
                  disabled={finishing}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-[10px] lg:text-xs disabled:opacity-70"
                >
                  {finishing ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  )}
                  Finish Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DigitalPrescription
        isOpen={showPrescription}
        onClose={() => setShowPrescription(false)}
        patient={patient}
        doctor={user}
        hospital={hospital}
        complaints={complaint}
        diagnosis={diagnosis}
        prescriptions={prescriptions}
        vitals={{
          heartRate: appointment?.vitals?.heartRate?.toString() || '--',
          temp: appointment?.vitals?.temperature?.toString() || '--',
          bp: appointment?.vitals?.bloodPressure || '--',
          weight: appointment?.vitals?.weight?.toString() || '--',
          spo2: appointment?.vitals?.oxygenLevel?.toString() || '--'
        }}
        date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        tokenDisplay={formatToken(appointment)}
      />
    </MainLayout>
  );
}
