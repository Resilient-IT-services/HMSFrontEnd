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
    globalThis.print();
  };

  const filteredPrescriptions = prescriptions.filter(p => p.medicine);
  
  // Pagination Logic
  // Conservative estimates for row counts to avoid overflow
  const rowsPerPageFirst = 4;
  const rowsPerPageOthers = 10;
  
  const prescriptionPages: PrescriptionRow[][] = [];
  if (filteredPrescriptions.length === 0) {
    prescriptionPages.push([]);
  } else {
    // First page
    prescriptionPages.push(filteredPrescriptions.slice(0, rowsPerPageFirst));
    // Subsequent pages
    for (let i = rowsPerPageFirst; i < filteredPrescriptions.length; i += rowsPerPageOthers) {
      prescriptionPages.push(filteredPrescriptions.slice(i, i + rowsPerPageOthers));
    }
  }

  const BrandingHeader = () => (
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
        <p className="font-body-sm text-on-surface-variant">emergency@vitalsync.health</p>
        <p className="font-body-sm text-on-surface-variant">www.vitalsync.health</p>
      </div>
    </div>
  );

  const SignatureFooter = () => (
    <div className="mt-auto pt-8 border-t border-gray-200">
      <div className="grid grid-cols-3 items-end gap-12">
        <div className="space-y-4">
          <p className="font-label-sm text-tertiary">FOLLOW-UP APPOINTMENT</p>
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <p className="text-body-sm text-on-surface-variant">Please bring this document for the next visit.</p>
        </div>
        <div className="text-center">

        </div>
        <div className="text-right flex flex-col items-end">

          <div className="border-t border-on-surface w-full pt-2">
            <p className="font-headline-sm">Dr. {doctor?.fullName || 'Marcus Sterling'}</p>
            <p className="text-body-sm text-tertiary">{doctor?.doctorInfo?.specialization || 'Senior Consultant'}</p>
            <p className="text-body-sm text-tertiary">Reg No: {doctor?.doctorInfo?.licenseNumber || 'MED-88291-S'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-12 no-print-backdrop">
      {/* Backdrop for closing */}
      <div className="fixed inset-0 no-print" onClick={onClose}></div>
      
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

      {/* Pages Wrapper */}
      <div className="flex flex-col gap-8 no-print-backdrop items-center">
        {prescriptionPages.map((pageRows, index) => (
          <div 
            key={index} 
            className="relative w-[210mm] h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col print-page animate-in fade-in zoom-in duration-300"
          >
            <BrandingHeader />

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
              {index === 0 && (
                <>
                  {/* Patient Information - Only on Page 1 */}
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

                  {/* Vitals Section - Only on Page 1 */}
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

                  {/* Clinical Observations - Only on Page 1 */}
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
                </>
              )}

              {/* Prescription Table - Header only on page 1 or on every page?
                  Usually, repeating the table header is good for clarity. */}
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                <h2 className="font-headline-md">
                  Medication Plan
                </h2>
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
                    {pageRows.map((p) => (
                      <tr key={p.id}>
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
                    {pageRows.length === 0 && index === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-tertiary">No medications prescribed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <SignatureFooter />
            
            {/* Page Number Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-tertiary font-mono uppercase tracking-widest">
              Page {index + 1} of {prescriptionPages.length}
            </div>

            {/* Print Note - Only on the last page */}
            {index === prescriptionPages.length - 1 && (
              <div className="mt-8 text-center text-[10px] text-tertiary font-medium uppercase tracking-widest no-print">
                This is a digital document generated by VitalSync Medical Systems.
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media screen {
          {
            margin-bottom: 2rem;
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

          .print-page {
            visibility: visible !important;
            display: flex !important;
            position: relative !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          .print-page * {
            visibility: visible !important;
          }

          .no-print {
            display: none !important;
          }
          
          .no-print-backdrop {
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin: 0 !important;
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
