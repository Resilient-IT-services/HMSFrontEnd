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
    spo2?: string;
  };
  date: string;
  tokenDisplay?: string;
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
  tokenDisplay,
}) => {
  const [followUpDate, setFollowUpDate] = React.useState<string>('');
  React.useEffect(() => {
    setFollowUpDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

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
  const rowsPerPageFirst = 4;
  const rowsPerPageOthers = 10;
  
  const prescriptionPages: PrescriptionRow[][] = [];
  if (filteredPrescriptions.length === 0) {
    prescriptionPages.push([]);
  } else {
    prescriptionPages.push(filteredPrescriptions.slice(0, rowsPerPageFirst));
    for (let i = rowsPerPageFirst; i < filteredPrescriptions.length; i += rowsPerPageOthers) {
      prescriptionPages.push(filteredPrescriptions.slice(i, i + rowsPerPageOthers));
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-10 pb-12 prescription-modal-overlay">
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
      <div className="flex flex-col gap-8 items-center prescription-pages-container">
        {prescriptionPages.map((pageRows, index) => (
          <div 
            key={index} 
            className="relative w-[210mm] h-[297mm] bg-white shadow-2xl p-[15mm] flex flex-col print-page animate-in fade-in zoom-in duration-300"
          >
            {/* Header: Branding & Address */}
            <div className="flex justify-between items-start border-b-2 border-primary-container pb-8 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-extrabold text-xl">C</div>
                  <h1 className="font-headline-xl text-primary leading-tight">{hospital?.name || 'CareFlow Hospital'}</h1>
                </div>
                <div className="font-body-md text-on-surface-variant max-w-xs pt-2">
                  {hospital?.address && <p>{hospital.address}</p>}
                  <p>{hospital?.city}{hospital?.state ? `, ${hospital.state}` : ''} {hospital?.pincode}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="font-label-md text-primary">Contact Details</p>
                <p className="font-body-sm text-on-surface-variant">emergency@careflow.health</p>
                <p className="font-body-sm text-on-surface-variant">www.careflow.health</p>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
              {index === 0 && (
                <>
                  <div className="border border-gray-400 rounded-lg px-5 py-4 flex justify-between items-center mb-6 bg-gray-50">

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-gray-500 font-bold">
                            Patient
                        </span>
                        {tokenDisplay && (
                          <span className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded border border-primary/20">
                            {tokenDisplay}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold">
            {patient?.fullName} / {patientAge()} yrs / {vitals.weight} kg
        </span>
                    </div>

                    <div className="flex gap-6 items-center text-sm">
                      <span>❤️ {vitals.heartRate} bpm</span>
                      <span>🌡 {vitals.temp}</span>
                      <span>🩸 {vitals.bp}</span>
                      {vitals.spo2 && <span>🫁 {vitals.spo2}%</span>}
                    </div>

                    <div className="text-right">
        <span className="text-[10px] uppercase text-gray-500 font-bold">
            Date
        </span>
                      <p className="font-semibold">{date}</p>
                    </div>
                  </div>

                  {/* Clinical Observations - Only on Page 1 */}
                  <div className="flex flex-col gap-6 mb-10">

                    <div className="border-l-4 border-outline-variant pl-4 py-2">
                      <h3 className="font-label-sm text-tertiary mb-2 uppercase tracking-wider">
                        Chief Complaints
                      </h3>
                      <p className="font-body-lg text-on-surface italic">
                        "{complaints || 'No complaints recorded'}"
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4 py-2">
                      <h3 className="font-label-sm text-primary mb-2 uppercase tracking-wider">
                        Diagnosis
                      </h3>
                      <p className="font-headline-sm text-on-surface">
                        {diagnosis || 'General Checkup'}
                      </p>
                    </div>

                  </div>
                </>
              )}

              {/* Prescription Table */}
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                <h2 className="font-headline-md">
                  Medication Plan {prescriptionPages.length > 1 ? `(Page ${index + 1})` : ''}
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

            {/* Footer: Signatures & QR */}
            <div className="mt-auto pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 items-end gap-12">
                <div className="space-y-4">
                  <p className="font-label-sm text-tertiary">FOLLOW-UP APPOINTMENT</p>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>{followUpDate}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Please bring this document for the next visit.</p>
                </div>
                <div className="text-center">

                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="mb-2">
                  </div>
                  <div className="border-t border-on-surface w-full pt-2">
                    <p className="font-headline-sm">Dr. {doctor?.fullName || 'Marcus Sterling'}</p>
                    <p className="text-body-sm text-tertiary">{doctor?.doctorInfo?.specialization || 'Senior Consultant'}</p>
                    <p className="text-body-sm text-tertiary">Reg No: {doctor?.doctorInfo?.licenseNumber || 'MED-88291-S'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page Number Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-tertiary font-mono uppercase tracking-widest">
              Page {index + 1} of {prescriptionPages.length}
            </div>

            {/* Print Note - Only on the last page */}
            {index === prescriptionPages.length - 1 && (
              <div className="mt-8 text-center text-[10px] text-tertiary font-medium uppercase tracking-widest no-print">
                This is a digital document generated by CareFlow Medical Systems.
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media screen {
          .print-page {
            margin-bottom: 2rem;
          }
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            height: auto !important;
            overflow: visible !important;
          }

          body {
            visibility: hidden;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* The main fixed wrapper of the modal */
          .prescription-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            visibility: visible !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: auto !important;
          }

          .prescription-pages-container {
            display: block !important;
            gap: 0 !important;
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
        }
      `}</style>
    </div>
  );
};

export default DigitalPrescription;
