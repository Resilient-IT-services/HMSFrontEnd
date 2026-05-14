'use client';

import React from 'react';
import { AppointmentResponse, PatientResponse } from '@/types/api';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface PatientHistoryDetailViewProps {
  selectedPatient: PatientResponse | null;
  patientVisits: AppointmentResponse[];
  selectedVisit: AppointmentResponse | null;
  loading: boolean;
  clearSelection: () => void;
  handleSelectVisit: (visit: AppointmentResponse) => void;
}

export const PatientHistoryDetailView: React.FC<PatientHistoryDetailViewProps> = ({
  selectedPatient,
  patientVisits,
  selectedVisit,
  loading,
  clearSelection,
  handleSelectVisit,
}) => {
  return (
    <div className="min-h-[calc(100vh-112px)] flex flex-col bg-slate-50 font-inter">
      
      {/* Detail Header */}
      <div className="px-4 py-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white shadow-sm z-10 gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Button 
            variant="secondary" 
            size="sm" 
            icon="arrow_back" 
            onClick={clearSelection}
            className="rounded-full w-10 h-10 p-0 shrink-0"
          />
          <div className="min-w-0">
            <PageHeading 
              title={selectedPatient?.fullName || 'Loading Profile...'}
              className="mb-0 text-lg sm:text-2xl truncate"
            />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <Badge variant="orange" size="sm" className="whitespace-nowrap">Code: {selectedPatient?.patientCode || '...'}</Badge>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter">
                {selectedPatient?.gender} • {selectedPatient?.dob ? `${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} Years` : '...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="secondary" icon="print" size="sm" className="flex-1 sm:flex-none text-[10px] sm:text-xs">Print EMR</Button>
          <Button icon="clinical_notes" href="/doctor/active-consultation" size="sm" className="flex-1 sm:flex-none text-[10px] sm:text-xs">Consultation</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden lg:overflow-visible">
        
        {/* Left Sidebar: Timeline - Scrollable on desktop, horizontal or collapsible on mobile? 
            Let's make it a scrollable top bar or side bar that stays above content on mobile.
        */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white overflow-x-auto lg:overflow-y-auto shrink-0 shadow-inner">
          <div className="p-4 sm:p-6 flex lg:flex-col gap-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap lg:mb-6">
              <span className="material-symbols-outlined text-sm">event_repeat</span>
              Visit Timeline
            </h3>
            
            <div className="flex lg:flex-col gap-4 relative lg:before:absolute lg:before:left-[11px] lg:before:top-2 lg:before:bottom-2 lg:before:w-[2px] lg:before:bg-slate-100">
              {patientVisits.map((visit) => (
                <div 
                  key={visit.id} 
                  className="relative lg:pl-8 group cursor-pointer shrink-0 w-48 lg:w-full" 
                  onClick={() => handleSelectVisit(visit)}
                >
                  <div className={`hidden lg:block absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-all ${
                    selectedVisit?.id === visit.id ? 'bg-orange-600 scale-110' : 'bg-slate-200 group-hover:bg-orange-300'
                  }`}></div>
                  <div className={`p-3 rounded-xl border transition-all h-full ${
                    selectedVisit?.id === visit.id 
                      ? 'bg-orange-50/50 border-orange-200 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}>
                    <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${selectedVisit?.id === visit.id ? 'text-orange-700' : 'text-slate-400'}`}>
                      {new Date(visit.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-900 text-xs">Consultation</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">Dr. {visit.doctorName}</p>
                  </div>
                </div>
              ))}
              {patientVisits.length === 0 && !loading && (
                <div className="text-center py-4 lg:py-10 opacity-50 w-full">
                  <span className="material-symbols-outlined text-2xl lg:text-4xl mb-2 text-slate-200">history_off</span>
                  <p className="text-[10px] lg:text-xs italic font-medium">No previous visits.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content: Visit Detail */}
        <div className="flex-1 bg-[#fcfcfd] overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-10">
            {selectedVisit ? (
              <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                
                {/* Summary Card */}
                <Card 
                  title={`Visit Summary • ${new Date(selectedVisit.appointmentTime).toLocaleDateString()}`}
                  icon="description"
                  headerActions={<Badge variant="emerald">{selectedVisit.status}</Badge>}
                  noPadding
                  className="overflow-hidden"
                >
                  <div className="p-4 sm:p-8 flex flex-col md:grid md:grid-cols-12 gap-6 sm:gap-10">
                    <div className="md:col-span-7">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Chief Complaint / Primary Concern</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {selectedVisit.notes?.split('.')[0] || 'Routine checkup and general physical examination.'}
                      </p>
                    </div>
                    <div className="md:col-span-5 flex flex-col justify-center md:border-l border-slate-100 md:pl-10 pt-4 md:pt-0 border-t md:border-t-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center md:text-left">Recorded Vitals</p>
                      <div className="grid grid-cols-2 xs:grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                        <div className="flex flex-col items-center bg-slate-50 px-2 py-2 sm:px-3 sm:py-2 rounded-xl border border-slate-100 min-w-[60px] sm:min-w-[70px]">
                          <span className="material-symbols-outlined text-orange-600 text-sm mb-1">favorite</span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{selectedVisit.vitals?.heartRate || '--'}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">BPM</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 px-2 py-2 sm:px-3 sm:py-2 rounded-xl border border-slate-100 min-w-[60px] sm:min-w-[70px]">
                          <span className="material-symbols-outlined text-blue-600 text-sm mb-1">device_thermostat</span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{selectedVisit.vitals?.temperature || '--'}°</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Temp</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 px-2 py-2 sm:px-3 sm:py-2 rounded-xl border border-slate-100 min-w-[60px] sm:min-w-[70px]">
                          <span className="material-symbols-outlined text-emerald-600 text-sm mb-1">blood_pressure</span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{selectedVisit.vitals?.bloodPressure || '--'}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">B/P</span>
                        </div>
                        <div className="flex flex-col items-center bg-slate-50 px-2 py-2 sm:px-3 sm:py-2 rounded-xl border border-slate-100 min-w-[60px] sm:min-w-[70px]">
                          <span className="material-symbols-outlined text-purple-600 text-sm mb-1">weight</span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">{selectedVisit.vitals?.weight || '--'}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">KG</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Detailed Notes & Prescription */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  
                  {/* Clinical Notes */}
                  <Card title="Clinical Findings & Diagnosis" icon="clinical_notes" className="shadow-sm">
                    <div className="space-y-6">
                      <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Physician's Assessment</p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                          "{selectedVisit.notes || 'No detailed physician notes available for this encounter.'}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Stable / Discharged</p>
                      </div>
                    </div>
                  </Card>

                  {/* Prescription */}
                  <Card 
                    title="Prescribed Medication" 
                    icon="medication" 
                    className="bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/10"
                    headerActions={<Badge variant="blue" size="sm">Active</Badge>}
                  >
                    <div className="space-y-4">
                      {selectedVisit.prescription?.items && selectedVisit.prescription.items.length > 0 ? (
                        selectedVisit.prescription.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-white truncate">{item.medicineName}</p>
                              <p className="text-[10px] text-white/50 font-medium truncate">{item.dosage} • {item.duration}</p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="material-symbols-outlined text-white/30 text-lg">medical_information</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center opacity-30">
                          <span className="material-symbols-outlined text-4xl mb-2">no_medication</span>
                          <p className="text-xs font-bold uppercase">No medication prescribed</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedVisit.prescription && (
                      <Button 
                        variant="ghost" 
                        fullWidth 
                        size="sm" 
                        className="mt-6 text-white/60 hover:text-white hover:bg-white/10 text-[10px] uppercase font-black tracking-widest"
                      >
                        View Prescription Details
                      </Button>
                    )}
                  </Card>

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 sm:py-40 opacity-20">
                <span className="material-symbols-outlined text-6xl sm:text-8xl mb-4">clinical_notes</span>
                <p className="font-manrope text-sm sm:text-xl font-black uppercase tracking-widest text-center px-4">Select a visit to view details</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
