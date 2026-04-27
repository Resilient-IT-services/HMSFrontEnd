'use client';

import React from 'react';
import { PatientResponse, UserResponse, HospitalResponse } from '@/types/api';

interface PrescriptionRow {
  id: string;
  medicine: string;
  frequency: string;
  instructions: string;
}

interface DigitalPrescriptionProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientResponse | null;
  doctor: UserResponse | null;
  hospital: HospitalResponse | null;
  complaints: string;
  diagnosis: string;
  prescriptions: PrescriptionRow[];
  vitals: {
    heartRate: string;
    temp: string;
    bp: string;
    weight: string;
  };
  date: string;
}

const DigitalPrescription: React.FC<DigitalPrescriptionProps> = ({
  isOpen,
  onClose,
  patient,
  doctor,
  hospital,
  complaints,
  diagnosis,
  prescriptions,
  vitals,
  date,
}) => {
  if (!isOpen) return null;

  const patientAge = () => {
    if (!patient?.dob) return '--';
    const birthDate = new Date(patient.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-12 no-print-backdrop">
      {/* Backdrop for closing */}
      <div className="absolute inset-0 no-print" onClick={onClose}></div>
      
      {/* Floating Action Button for Printing - Visible only on screen */}
      <div className="fixed top-6 right-10 z-[110] flex gap-3 no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl active:scale-95"
        >
          <span className="material-symbols-outlined">print</span>
          Print PDF
        </button>
        <button 
          onClick={onClose}
          className="bg-white text-gray-700 p-3 rounded-xl shadow-xl hover:bg-gray-50 transition-all border border-gray-200"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main A4 Paper Wrapper */}
      <div className="relative w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col print-container mb-12 animate-in fade-in zoom-in duration-300">
        
        {/* Header: Branding & Address */}
        <div className="flex justify-between items-start border-b-2 border-primary-container pb-8 mb-8">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-extrabold text-xl">V</div>
                    <h1 className="font-headline-xl text-primary leading-tight">{hospital?.name || 'VitalSync Hospital'}</h1>
                </div>
                <div className="font-body-md text-on-surface-variant max-w-xs pt-2">
                    {hospital?.address && <p>{hospital.address}</p>}
                    <p>{hospital?.city}{hospital?.state ? `, ${hospital.state}` : ''} {hospital?.pincode}</p>
                </div>
            </div>
            <div className="text-right space-y-1">
                <p className="font-label-md text-primary">Contact Details</p>
                <p className="font-body-sm text-on-surface-variant">{hospital?.phone || '+1 (555) 123-4567'}</p>
                <p className="font-body-sm text-on-surface-variant">emergency@vitalsync.health</p>
                <p className="font-body-sm text-on-surface-variant">www.vitalsync.health</p>
            </div>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-4 gap-6 bg-surface-container-lowest border border-outline-variant p-6 rounded-xl mb-8">
            <div className="flex flex-col gap-1">
                <span className="font-label-sm text-tertiary">PATIENT NAME</span>
                <span className="font-headline-sm text-on-surface">{patient?.fullName || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-label-sm text-tertiary">AGE / GENDER</span>
                <span className="font-headline-sm text-on-surface">{patientAge()} / {patient?.gender || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-label-sm text-tertiary">WEIGHT</span>
                <span className="font-headline-sm text-on-surface">{vitals.weight || '--'}kg</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-label-sm text-tertiary">DATE</span>
                <span className="font-headline-sm text-on-surface">{date}</span>
            </div>
        </div>

        {/* Vitals Section */}
        <div className="flex gap-12 mb-10 px-2">
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">favorite</span>
                <div>
                    <p className="font-label-sm text-tertiary">HEART RATE</p>
                    <p className="font-headline-md">{vitals.heartRate} <span className="text-body-sm font-normal">bpm</span></p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">thermostat</span>
                <div>
                    <p className="font-label-sm text-tertiary">TEMP</p>
                    <p className="font-headline-md">{vitals.temp} <span className="text-body-sm font-normal">°F</span></p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">blood_pressure</span>
                <div>
                    <p className="font-label-sm text-tertiary">BLOOD PRESSURE</p>
                    <p className="font-headline-md">{vitals.bp} <span className="text-body-sm font-normal">mmHg</span></p>
                </div>
            </div>
        </div>

        {/* Clinical Observations */}
        <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="border-l-4 border-outline-variant pl-4 py-2">
                <h3 className="font-label-sm text-tertiary mb-2 uppercase tracking-wider">Chief Complaints</h3>
                <p className="font-body-lg text-on-surface italic">"{complaints || 'No complaints recorded'}"</p>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2">
                <h3 className="font-label-sm text-primary mb-2 uppercase tracking-wider">Diagnosis</h3>
                <p className="font-headline-sm text-on-surface">{diagnosis || 'General Checkup'}</p>
            </div>
        </div>

        {/* Prescription Content */}
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                <h2 className="font-headline-md">Medication Plan</h2>
            </div>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-high border-b border-gray-200">
                    <tr>
                        <th className="p-4 font-label-md text-on-surface">Medicine Name & Dosage</th>
                        <th className="p-4 font-label-md text-on-surface text-center">Frequency</th>
                        <th className="p-4 font-label-md text-on-surface">Instructions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {prescriptions.filter(p => p.medicine).map((p) => (
                      <tr key={p.id} className="break-inside-avoid">
                          <td className="p-4">
                              <p className="font-headline-sm">{p.medicine}</p>
                              <p className="text-body-sm text-tertiary">Prescribed Medicine</p>
                          </td>
                          <td className="p-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                  <span className="font-body-md font-bold">{p.frequency}</span>
                              </div>
                          </td>
                          <td className="p-4">
                              <p className="font-body-md">{p.instructions}</p>
                          </td>
                      </tr>
                    ))}
                    {prescriptions.filter(p => p.medicine).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-tertiary">No medications prescribed</td>
                      </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer: Signatures & QR */}
        <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-3 items-end gap-12">
                <div className="space-y-4">
                    <p className="font-label-sm text-tertiary">FOLLOW-UP APPOINTMENT</p>
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span>{new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">Please bring this document for the next visit.</p>
                </div>
                <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-white border border-gray-200 p-2 rounded-lg">
                        <img alt="Verification QR Code" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1rvvxUWJmSPSNziL08HKcqTYRQFEQlNf3AhQQLDCrQbqvnWJNNeQLwizywvUXvAC7Qq88A8gTZdUYjBZcr491p3wFbaAstWYjxNTAq92z_0pXjNe96aNEx5ifrEDMsFZLvFfVm9MM5L1aqqYQ_YYUQ55akj31PAyh2CE0NcikOiQ3GLTyychW2ybx0pWA976yiT5k5cn9xXUlT8uCvoCSNb7vmzwBHwazFZgHWzrlKr5YOAAZf7XUPC9rFpB2XBrxWHp7nweOm_M"/>
                    </div>
                    <p className="text-[10px] mt-2 text-tertiary font-mono uppercase">ID: VS-{patient?.fullName?.substring(0,2).toUpperCase() || 'PT'}-{Math.floor(Math.random() * 90000) + 10000}-{new Date().getFullYear()}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="mb-2">
                        <img alt="Doctor Signature" className="h-16 w-40 object-contain mix-blend-multiply opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtaQLHVQH732Q0TU7dZEt41zRX3xNqaZsaldxe9EpqlAM_VWKrMJxYNWy_FSVrM0EQULXFz5Wp9rxiAMQO2PSVql-g_DerrT4h1vfDk3xxSmjnEZTpkHpnrg5HRmNVk0cMjeZa-pQClUPJYw0-adcyDugjG_XJDh2AUAiAd0Wsh2vrmyyYBF2Hrh9ihkTIKxS_dsdO4zM8V1Ut4GRDjV9rdZeAfemsnkqdsVPkm_SvpNcdhPT-uQKzg6Y5l_v0FBTTOKFPPOaRKBg"/>
                    </div>
                    <div className="border-t border-on-surface w-full pt-2">
                        <p className="font-headline-sm">Dr. {doctor?.fullName || 'Marcus Sterling'}</p>
                        <p className="text-body-sm text-tertiary">{doctor?.doctorInfo?.specialization || 'Senior Consultant'}</p>
                        <p className="text-body-sm text-tertiary">Reg No: {doctor?.doctorInfo?.licenseNumber || 'MED-88291-S'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Print Note */}
        <div className="mt-8 text-center text-[10px] text-tertiary font-medium uppercase tracking-widest no-print">
            This is a digital document generated by VitalSync Medical Systems.
        </div>

      </div>

      <style jsx global>{`
        @media screen {
          .print-container {
            margin-left: auto;
            margin-right: auto;
          }
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            visibility: hidden;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Only show the print container and its contents */
          .print-container {
            visibility: visible !important;
            display: flex !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            z-index: 9999 !important;
          }

          .print-container * {
            visibility: visible !important;
          }

          .no-print {
            display: none !important;
          }
          
          .no-print-backdrop {
            background: none !important;
            backdrop-filter: none !important;
          }

          /* Prevent duplicate pages by hiding everything else */
          #root, .next-route-announcer, [data-nextjs-scroll-focus-boundary] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalPrescription;
