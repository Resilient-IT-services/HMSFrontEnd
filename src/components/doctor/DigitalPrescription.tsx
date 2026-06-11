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
  investigations?: { id: string, testName: string, testCode: string, notes?: string }[];
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
  investigations = [],
  vitals,
  date,
  tokenDisplay,
}) => {
  const [followUpDate] = React.useState<string>(() => 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  if (!isOpen) return null;

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handlePrint = () => {
    globalThis.print();
  };

  const filteredPrescriptions = prescriptions.filter(p => p.medicine);
  
  // Advanced Pagination Logic for Professional Document
  // Page 1 has header, patient info, vitals, clinical info, and SOME meds
  // Subsequent pages have header and more meds/labs
  const ITEMS_PER_PAGE_FIRST = 6;
  const ITEMS_PER_PAGE_OTHERS = 15;
  
  const pages: { meds: PrescriptionRow[], labs: any[] }[] = [];
  
  // Split meds and labs into logical chunks
  let currentMeds = [...filteredPrescriptions];
  let currentLabs = [...investigations];

  // Page 1
  pages.push({
    meds: currentMeds.splice(0, ITEMS_PER_PAGE_FIRST),
    labs: currentMeds.length === 0 ? currentLabs.splice(0, 8) : [] // Only add labs if meds finished or small
  });

  // Overflow pages
  while (currentMeds.length > 0 || currentLabs.length > 0) {
    pages.push({
      meds: currentMeds.splice(0, ITEMS_PER_PAGE_OTHERS),
      labs: currentMeds.length === 0 ? currentLabs.splice(0, ITEMS_PER_PAGE_OTHERS) : []
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-slate-900/80 backdrop-blur-md overflow-y-auto pt-6 pb-12 prescription-modal-overlay no-scrollbar">
      {/* Backdrop for closing */}
      <div className="fixed inset-0 no-print" onClick={onClose}></div>
      
      {/* Action Controls */}
      <div className="fixed top-6 right-10 z-[110] flex gap-3 no-print">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-orange-700 transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-lg">print</span> Print Document
        </button>
        <button 
          onClick={onClose}
          className="bg-white/10 text-white p-3 rounded-2xl shadow-xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/20"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Prescription Document Pages */}
      <div className="flex flex-col gap-10 items-center w-full px-4 sm:px-0 prescription-pages-container">
        {pages.map((pageData, index) => (
          <div 
            key={index} 
            className="relative w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl flex flex-col print-page animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-none overflow-hidden font-inter"
          >
            {/* Header: Hospital Branding - Simplified */}
            <div className="p-8 sm:p-10 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{hospital?.name || 'LAARA HMS'}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hospital?.address || 'Healthcare Management System'}</p>
                <div className="mt-2 flex items-center gap-2">
                   <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Dr. {doctor?.fullName}</span>
                   <span className="text-[8px] font-bold text-slate-300">•</span>
                   <span className="text-[9px] font-bold text-slate-500 uppercase italic tracking-tight">{doctor?.doctorInfo?.specialization || 'Consultant'}</span>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Consultation Date</p>
                 <p className="text-sm font-black text-slate-900">{date}</p>
                 {tokenDisplay && (
                   <span className="mt-1 inline-block text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-widest">#{tokenDisplay}</span>
                 )}
              </div>
            </div>

            {/* Page 1 Specific Sections */}
            {index === 0 && (
              <>
                {/* Patient Profile Bar - Clean & Simple */}
                <div className="px-10 py-4 flex justify-between items-center gap-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-8">
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Patient</span>
                       <span className="text-xs font-black text-slate-900 uppercase">{patient?.fullName}</span>
                     </div>
                     <div className="w-px h-6 bg-slate-200"></div>
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Age / Sex</span>
                       <span className="text-xs font-bold text-slate-700">{patient?.dob ? calculateAge(patient.dob) : '--'} Yrs • {patient?.gender}</span>
                     </div>
                     <div className="w-px h-6 bg-slate-200"></div>
                     <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Patient ID</span>
                       <span className="text-xs font-mono font-bold text-slate-600 uppercase">{patient?.patientCode || 'PT-NEW'}</span>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[9px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100 uppercase tracking-widest">Validated Rx</span>
                  </div>
                </div>

                {/* Vitals Grid - Simplified Inline */}
                <div className="px-10 py-4 flex items-center justify-between gap-4 border-b border-slate-100 bg-white shrink-0">
                  {[
                    { label: 'Heart Rate', value: vitals.heartRate, unit: 'bpm', color: 'text-orange-600' },
                    { label: 'Temperature', value: vitals.temp, unit: '°F', color: 'text-blue-600' },
                    { label: 'Weight', value: vitals.weight, unit: 'kg', color: 'text-indigo-600' },
                    { label: 'BP', value: vitals.bp, unit: 'mmHg', color: 'text-emerald-600' },
                    { label: 'SpO2', value: vitals.spo2, unit: '%', color: 'text-cyan-600' }
                  ].map((v, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{v.label}</span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-black text-slate-800">{v.value || '--'}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{v.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clinical Content - Compact */}
                <div className="grid grid-cols-2 border-b border-slate-100 shrink-0 divide-x divide-slate-100">
                  <div className="p-8 space-y-2">
                     <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1 h-1 bg-slate-400 rounded-full"></span> Chief Complaints
                     </h3>
                     <div className="text-xs font-medium text-slate-700 leading-relaxed italic">
                        {complaints || 'No specific complaints recorded.'}
                     </div>
                  </div>
                  <div className="p-8 space-y-2">
                     <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Clinical Diagnosis
                     </h3>
                     <div className="text-sm font-black text-slate-900 leading-relaxed uppercase tracking-tight">
                        {diagnosis || 'General Checkup'}
                     </div>
                  </div>
                </div>
              </>
            )}

            {/* Treatment Content (Meds & Labs) */}
            <div className="flex-1 p-8 flex flex-col gap-8">
               {/* Medications Section */}
               {pageData.meds.length > 0 && (
                 <section className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="material-symbols-outlined text-orange-600 text-sm">medication</span> Prescribed Medications
                    </h3>
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Medicine Details</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Dosage</th>
                                <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {pageData.meds.map((med, idx) => (
                               <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                 <td className="px-4 py-3">
                                   <div className="text-[12px] font-black text-slate-900">{med.medicine}</div>
                                   {med.composition && <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{med.composition}</div>}
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <div className="text-[11px] font-black text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block min-w-[60px]">{med.frequency}</div>
                                 </td>
                                 <td className="px-4 py-3 text-right">
                                   <div className="text-[10px] font-bold text-slate-500 uppercase">{med.duration}</div>
                                 </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </section>
               )}

               {/* Lab Investigations Section */}
               {pageData.labs.length > 0 && (
                 <section className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="material-symbols-outlined text-blue-600 text-sm">biotech</span> Laboratory Investigations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {pageData.labs.map((lab, idx) => (
                         <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{lab.testName}</span>
                            {lab.notes && <span className="text-[9px] font-medium text-slate-400 italic leading-relaxed border-t border-slate-200/60 pt-1 mt-1">Note: {lab.notes}</span>}
                         </div>
                       ))}
                    </div>
                 </section>
               )}
            </div>

            {/* Formal Document Footer */}
            <div className="p-8 border-t border-slate-100 flex justify-between items-end shrink-0">
              <div className="space-y-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Advice / Follow-up</p>
                 <div className="text-[10px] font-bold text-slate-600 max-w-sm">
                    Review with reports in {followUpDate} or as advised. Please strictly follow the prescribed dosages.
                 </div>
              </div>
              <div className="text-right">
                 <div className="h-px w-40 bg-slate-300 mb-2 ml-auto"></div>
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Dr. {doctor?.fullName}</p>
                 <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Digitally Authorized Prescription</p>
              </div>
            </div>

            {/* Document Pagination Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">
               Page {index + 1} of {pages.length}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media screen {
          .print-page {
            margin-bottom: 3rem;
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
            background: white !important;
          }

          body {
            visibility: hidden;
            margin: 0 !important;
            padding: 0 !important;
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
            background: white !important;
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
            padding: 0 !important;
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
