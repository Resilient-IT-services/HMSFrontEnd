'use client';

import React from 'react';
import { PatientResponse, UserResponse, HospitalResponse } from '@/types/api';

interface PrescriptionRow {
  id: string;
  medicine: string;
  frequency: string;
  instructions: string;
  composition?: string;
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
  investigations?: { id: string, testName: string, testCode: string }[];
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
  const [followUpDate] = React.useState<string>(() => 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  );

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
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/60 backdrop-blur-sm overflow-y-auto pt-4 sm:pt-10 pb-12 prescription-modal-overlay">
      {/* Backdrop for closing */}
      <div className="fixed inset-0 no-print" onClick={onClose}></div>
      
      {/* Floating Action Buttons - Improved for mobile */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-10 z-[110] flex gap-2 sm:gap-3 no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-xl active:scale-95 text-xs sm:text-base"
        >
          <span className="material-symbols-outlined text-sm sm:text-base">print</span>
          <span className="hidden xs:inline">Print PDF</span>
          <span className="xs:hidden">Print</span>
        </button>
        <button 
          onClick={onClose}
          className="bg-white text-gray-700 p-2 sm:p-3 rounded-xl shadow-xl hover:bg-gray-50 transition-all border border-gray-200"
        >
          <span className="material-symbols-outlined text-sm sm:text-base">close</span>
        </button>
      </div>

      {/* Pages Wrapper */}
      <div className="flex flex-col gap-6 sm:gap-8 items-center w-full px-4 sm:px-0 prescription-pages-container">
        {prescriptionPages.map((pageRows, index) => (
          <div 
            key={index} 
            className="relative w-full max-w-[210mm] min-h-[auto] lg:min-h-[297mm] bg-white shadow-2xl p-6 sm:p-[15mm] flex flex-col print-page animate-in fade-in zoom-in duration-300 rounded-2xl lg:rounded-none"
          >
            {/* Header: Branding & Address */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-orange-600 pb-6 sm:pb-8 mb-6 sm:mb-8 gap-4 sm:gap-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg sm:text-xl">C</div>
                  <h1 className="text-xl sm:text-3xl font-black text-orange-700 leading-tight">{hospital?.name || 'CareFlow Hospital'}</h1>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 max-w-xs pt-2">
                  {hospital?.address && <p>{hospital.address}</p>}
                  <p>{hospital?.city}{hospital?.state ? `, ${hospital.state}` : ''} {hospital?.pincode}</p>
                </div>
              </div>
              <div className="sm:text-right space-y-1">
                <p className="text-xs sm:text-sm font-bold text-orange-600 uppercase tracking-widest">Contact Details</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">emergency@careflow.health</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">www.careflow.health</p>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col">
              {index === 0 && (
                <>
                  <div className="border border-slate-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row justify-between sm:items-center mb-6 bg-slate-50 gap-4">

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-black tracking-widest">
                            Patient
                        </span>
                        {tokenDisplay && (
                          <span className="bg-orange-600/10 text-orange-700 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded border border-orange-600/20 uppercase">
                            {tokenDisplay}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {patient?.fullName} / {patientAge()} yrs / {vitals.weight} kg
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] sm:text-sm font-bold text-slate-600">
                      <span className="flex items-center gap-1.5"><span className="text-orange-600 text-sm">favorite</span> {vitals.heartRate} <span className="text-[8px] text-slate-400">BPM</span></span>
                      <span className="flex items-center gap-1.5"><span className="text-blue-600 text-sm">device_thermostat</span> {vitals.temp}</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-600 text-sm">blood_pressure</span> {vitals.bp}</span>
                      {vitals.spo2 && <span className="flex items-center gap-1.5"><span className="text-purple-600 text-sm">air</span> {vitals.spo2}%</span>}
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
                      <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-black tracking-widest">
                          Date
                      </span>
                      <p className="font-bold text-slate-900 text-sm sm:text-base">{date}</p>
                    </div>
                  </div>

                  {/* Clinical Observations - Only on Page 1 */}
                  <div className="flex flex-col gap-6 mb-10">

                    <div className="border-l-4 border-slate-200 pl-4 py-2">
                      <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        Chief Complaints
                      </h3>
                      <p className="text-sm sm:text-lg font-medium text-slate-700 italic leading-relaxed">
                        "{complaints || 'No complaints recorded'}"
                      </p>
                    </div>

                    <div className="border-l-4 border-orange-600 pl-4 py-2">
                      <h3 className="text-[9px] sm:text-[10px] font-black text-orange-600 mb-2 uppercase tracking-widest">
                        Diagnosis
                      </h3>
                      <p className="text-base sm:text-xl font-bold text-slate-900">
                        {diagnosis || 'General Checkup'}
                      </p>
                    </div>

                  </div>
                </>
              )}

              {/* Investigations - Only on Page 1 if they exist */}
              {index === 0 && investigations && investigations.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-blue-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>biotech</span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Ordered Investigations</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                    {investigations.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        <span className="text-xs sm:text-sm font-bold text-slate-700">{inv.testName}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">({inv.testCode})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescription Table */}
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-orange-600 text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>prescriptions</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                  Medication Plan {prescriptionPages.length > 1 ? `(Page ${index + 1})` : ''}
                </h2>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 sm:p-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine & Dosage</th>
                      <th className="p-3 sm:p-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Frequency</th>
                      <th className="p-3 sm:p-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pageRows.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 sm:p-4">
                          <p className="font-bold text-slate-900 text-sm sm:text-base">{p.medicine}</p>
                          {p.composition && (
                            <p className="text-[9px] text-orange-600 font-black italic mb-1 uppercase tracking-tight">
                              Salts: {p.composition}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 font-medium">Prescribed Medicine</p>
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          <span className="font-bold text-slate-700 text-xs sm:text-sm whitespace-nowrap">{p.frequency}</span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{p.instructions}</p>
                        </td>
                      </tr>
                    ))}
                    {pageRows.length === 0 && index === 0 && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No medications prescribed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer: Signatures & QR */}
            <div className="mt-auto pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-end gap-8 sm:gap-12">
                <div className="w-full sm:w-auto space-y-3 sm:space-y-4">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">FOLLOW-UP APPOINTMENT</p>
                  <div className="flex items-center gap-2 text-orange-600 font-black text-sm sm:text-base">
                    <span className="material-symbols-outlined text-sm sm:text-base">calendar_today</span>
                    <span>{followUpDate}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Please bring this document for the next visit.</p>
                </div>
                
                <div className="flex-1 hidden sm:block"></div>

                <div className="w-full sm:w-auto text-right flex flex-col items-end">
                  <div className="border-t border-slate-900 w-full pt-3">
                    <p className="text-sm sm:text-base font-black text-slate-900">Dr. {doctor?.fullName || 'Marcus Sterling'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{doctor?.doctorInfo?.specialization || 'Senior Consultant'}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase">Reg No: {doctor?.doctorInfo?.licenseNumber || 'MED-88291-S'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Page Number Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
              Page {index + 1} of {prescriptionPages.length}
            </div>

            {/* Print Note - Only on the last page */}
            {index === prescriptionPages.length - 1 && (
              <div className="mt-8 text-center text-[8px] sm:text-[10px] text-slate-300 font-black uppercase tracking-[0.2em] no-print">
                Generated by CareFlow Medical Systems
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
            padding: 0 !important;
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
            border-radius: 0 !important;
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
