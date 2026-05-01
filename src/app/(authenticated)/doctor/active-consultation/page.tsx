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
  composition?: string;
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

  const updatePrescription = (index: number, field: keyof PrescriptionRow, value: string, extra?: { medicineId?: string; composition?: string }) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index] = { ...newPrescriptions[index], [field]: value };
    
    if (extra?.medicineId) {
      newPrescriptions[index].medicineId = extra.medicineId;
    }
    if (extra?.composition) {
      newPrescriptions[index].composition = extra.composition;
    }
    
    if (index === prescriptions.length - 1 && value !== '' && field === 'medicine') {
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
      <main className="p-6 lg:p-10 bg-surface min-h-[calc(100vh-64px)]">
        <div className="max-w-[1440px] mx-auto">
          {/* Sub Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <nav className="flex items-center gap-2 text-gray-500 mb-2 font-body-sm">
                <span className="material-symbols-outlined text-sm">home</span>
                <span>/</span>
                <span>Consultation</span>
                <span>/</span>
                <span className="text-primary font-medium">Active Session</span>
              </nav>
              <div className="flex items-center gap-4">
                <h2 className="font-headline-xl text-on-surface">Active Consultation</h2>
                <div className="h-8 w-[1px] bg-gray-300 hidden sm:block"></div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <span className="font-manrope font-bold text-lg">{patient?.fullName || 'Unknown Patient'}</span>
                  <span className="text-sm font-medium">{patientAge} Yrs</span>
                  <span className="text-sm font-medium">{appointment?.vitals?.weight || '--'} Kg</span>
                  <span className="text-sm font-medium">{patient?.gender}</span>
                  {appointment?.tokenDisplay && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black border border-primary/20 ml-2 uppercase">
                      Token: {appointment.tokenDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded-xl border border-outline-variant shadow-sm flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400">Vitals</span>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">favorite</span>
                    <span className="font-manrope font-bold text-sm">{appointment?.vitals?.heartRate || '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 border-l pl-4 border-gray-100">
                    <span className="material-symbols-outlined text-blue-500 text-sm">device_thermostat</span>
                    <span className="font-manrope font-bold text-sm">{appointment?.vitals?.temperature || '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 border-l pl-4 border-gray-100">
                    <span className="material-symbols-outlined text-green-500 text-sm">blood_pressure</span>
                    <span className="font-manrope font-bold text-sm">{appointment?.vitals?.bloodPressure || '--'}</span>
                  </div>
                  {appointment?.vitals?.oxygenLevel && (
                    <div className="flex items-center gap-1 border-l pl-4 border-gray-100">
                      <span className="material-symbols-outlined text-cyan-500 text-sm">pulse_alert</span>
                      <span className="font-manrope font-bold text-sm">{appointment?.vitals?.oxygenLevel}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-gutter">
            {/* Left Column: Complaint & Diagnosis */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">record_voice_over</span> Patient Complaint
                  </h3>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                </div>
                <textarea 
                  className="w-full min-h-[220px] p-4 bg-gray-50/50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body-md leading-relaxed resize-none outline-none" 
                  placeholder="Enter patient symptoms and complaints here..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">medical_information</span> Diagnosis
                  </h3>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </button>
                </div>
                <textarea 
                  className="w-full min-h-[220px] p-4 bg-gray-50/50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body-md leading-relaxed resize-none outline-none" 
                  placeholder="Enter final clinical diagnosis and assessment..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {icdCodes.map((icd) => (
                    <span key={icd.code} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold">
                      {icd.code} {icd.label}
                      <span 
                        className="material-symbols-outlined text-[14px] cursor-pointer" 
                        onClick={() => removeIcdCode(icd.code)}
                      >
                        close
                      </span>
                    </span>
                  ))}
                  <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                    + Add ICD-10 Code
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Prescriptions */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span> Prescriptions
                  </h3>
                </div>
                
                <div className="flex-1 space-y-4">
                  {prescriptions.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-50 last:border-none">
                      <div className="col-span-12 md:col-span-5">
                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Medicine Name</label>}
                        <MedicineAutocomplete 
                          defaultValue={row.medicine}
                          onSelect={(med) => updatePrescription(index, 'medicine', med.name, { medicineId: med.id, composition: med.composition })}
                          placeholder="Select Medicine..."
                          className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                        {row.composition && (
                          <p className="mt-1 text-[10px] text-primary/70 font-medium italic truncate" title={row.composition}>
                            Salts: {row.composition}
                          </p>
                        )}
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Frequency</label>}
                        <select 
                          className="w-full px-3 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          value={row.frequency}
                          onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                        >
                          <option value="">Frequency...</option>
                          <option value="3 times a day">3 times a day</option>
                          <option value="2 times a day">2 times a day</option>
                          <option value="Once daily">Once daily</option>
                          <option value="As needed">As needed</option>
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-4">
                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Instructions</label>}
                        <select 
                          className="w-full px-3 py-2.5 bg-gray-50 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                          value={row.instructions}
                          onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        >
                          <option value="">Instructions...</option>
                          <option value="After lunch">After lunch</option>
                          <option value="Before breakfast">Before breakfast</option>
                          <option value="Before sleep">Before sleep</option>
                          <option value="Empty stomach">Empty stomach</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowPrescription(true)}
                    className="px-6 py-3 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wide text-xs"
                  >
                    <span className="material-symbols-outlined text-[20px]">visibility</span> Preview
                  </button>
                  <button 
                    onClick={handleFinishConsultation}
                    disabled={finishing}
                    className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 uppercase tracking-wide text-xs disabled:opacity-70"
                  >
                    {finishing ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    )}
                    Finish & Generate Rx
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
