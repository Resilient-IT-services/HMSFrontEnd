'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { Table, Column } from '@/components/ui/Table';
import { AppointmentSummaryDTO, PatientSummaryDTO } from '@/types/api';
import { formatToken } from '@/utils/tokenHelper';
import { useMedicalHistory } from '@/modules/doctor/hooks/useMedicalHistory';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSurface } from '@/components/ui/PageSurface';
import { Card } from '@/components/ui/Card';

export const MedicalHistoryPage = () => {
  const router = useRouter();
  const {
    patientId,
    patients,
    historyAppointments,
    selectedPatient,
    patientVisits,
    selectedVisit,
    loading,
    searchTerm,
    setSearchTerm,
    activeView,
    setActiveView,
    appointmentsPage,
    setAppointmentsPage,
    appointmentsTotalElements,
    patientsPage,
    setPatientsPage,
    patientsTotalElements,
    handleSearch,
    selectPatient,
    handleSelectVisit,
    clearSelection
  } = useMedicalHistory();

  // --- Directory View Columns ---

  const appointmentColumns: Column<AppointmentSummaryDTO>[] = [
    {
      header: 'Visit Date',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">
            {new Date(row.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {new Date(row.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )
    },
    {
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
            {row.patientName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.patientName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Code: {row.patientCode || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Token',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">
          {formatToken(row)}
        </span>
      )
    },
    {
      header: 'Status',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => <Badge variant="emerald">{row.status}</Badge>
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="visibility" 
          onClick={() => selectPatient(row.patientId)}
        >
          View Record
        </Button>
      )
    }
  ];

  const patientColumns: Column<PatientSummaryDTO>[] = [
    {
      header: 'Code',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded uppercase">
          {row.patientCode || 'N/A'}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase border-2 border-white shadow-sm">
            {row.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-none mb-1">{row.fullName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Gender',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => <span className="capitalize text-sm font-medium">{row.gender.toLowerCase()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          icon="history" 
          onClick={() => selectPatient(row.id)}
        >
          View History
        </Button>
      )
    }
  ];

  // --- Main Render Logic ---

  if (!patientId) {
    return (
      <MainLayout title="Medical History" hideTitle>
        <PageSurface paddingClassName="p-8">
          <PageHeading 
            title="Medical History" 
            description="Review past consultations and comprehensive patient health records."
          />

          {/* Directory Toolbar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-12">
              <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                  <Button 
                    variant={activeView === 'APPOINTMENTS' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('APPOINTMENTS')}
                    className={`px-6 py-2 text-xs font-bold ${activeView === 'APPOINTMENTS' ? 'shadow-md' : 'text-slate-500'}`}
                  >
                    All Visits
                  </Button>
                  <Button 
                    variant={activeView === 'PATIENTS' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('PATIENTS')}
                    className={`px-6 py-2 text-xs font-bold ${activeView === 'PATIENTS' ? 'shadow-md' : 'text-slate-500'}`}
                  >
                    Patients
                  </Button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <SearchInput 
                      placeholder={activeView === 'APPOINTMENTS' ? "Search by patient name, ID, or token..." : "Search patients by name, code, or phone..."} 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button icon="search" onClick={() => handleSearch()} isLoading={loading}>Search</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <Card className="overflow-hidden mb-12" noPadding>
            {activeView === 'APPOINTMENTS' ? (
              <Table 
                columns={appointmentColumns} 
                data={historyAppointments} 
                isLoading={loading}
                onRowDoubleClick={(row) => selectPatient((row as AppointmentSummaryDTO).patientId)}
                emptyMessage={
                  <div className="py-12 text-center">
                    <p className="text-slate-400 italic mb-4">No completed visits found matching "{searchTerm}".</p>
                    {searchTerm && (
                      <Button variant="secondary" size="sm" onClick={() => setActiveView('PATIENTS')}>
                        Search in All Patients
                      </Button>
                    )}
                  </div>
                }
              />
            ) : (
              <Table 
                columns={patientColumns} 
                data={patients} 
                isLoading={loading}
                onRowDoubleClick={(row) => selectPatient((row as PatientSummaryDTO).id)}
                emptyMessage={
                  <div className="py-12 text-center">
                    <p className="text-slate-400 italic">No patient records found matching "{searchTerm}".</p>
                  </div>
                }
              />
            )}

            <Pagination 
              page={activeView === 'APPOINTMENTS' ? appointmentsPage : patientsPage} 
              totalElements={activeView === 'APPOINTMENTS' ? appointmentsTotalElements : patientsTotalElements} 
              pageSize={10}
              onPageChange={activeView === 'APPOINTMENTS' ? setAppointmentsPage : setPatientsPage} 
              label={activeView === 'APPOINTMENTS' ? "visits" : "patients"}
            />
          </Card>
        </PageSurface>
      </MainLayout>
    );
  }

  // --- Detail View (Patient Selected) ---

  return (
    <MainLayout title="Patient Medical History" hideTitle>
      <div className="h-[calc(100vh-112px)] flex flex-col bg-slate-50 overflow-hidden font-inter">
        
        {/* Detail Header */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm z-10">
          <div className="flex items-center gap-6">
            <Button 
              variant="secondary" 
              size="sm" 
              icon="arrow_back" 
              onClick={clearSelection}
              className="rounded-full w-10 h-10 p-0"
            />
            <div>
              <PageHeading 
                title={selectedPatient?.fullName || 'Loading Profile...'}
                className="mb-0"
              />
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="orange" size="sm">Code: {selectedPatient?.patientCode || '...'}</Badge>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                  {selectedPatient?.gender} • {selectedPatient?.dob ? `${new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} Years` : '...'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" icon="print">Print EMR</Button>
            <Button icon="clinical_notes" href="/doctor/active-consultation">Consultation</Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Timeline */}
          <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto shrink-0 shadow-inner">
            <div className="p-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_repeat</span>
                Visit Timeline
              </h3>
              
              <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {patientVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="relative pl-8 group cursor-pointer" 
                    onClick={() => handleSelectVisit(visit)}
                  >
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 transition-all ${
                      selectedVisit?.id === visit.id ? 'bg-orange-600 scale-110' : 'bg-slate-200 group-hover:bg-orange-300'
                    }`}></div>
                    <div className={`p-3 rounded-xl border transition-all ${
                      selectedVisit?.id === visit.id 
                        ? 'bg-orange-50/50 border-orange-200 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}>
                      <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${selectedVisit?.id === visit.id ? 'text-orange-700' : 'text-slate-400'}`}>
                        {new Date(visit.appointmentTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="font-bold text-slate-900 text-xs">Consultation</p>
                      <p className="text-[10px] text-slate-500 font-medium">Dr. {visit.doctorName}</p>
                    </div>
                  </div>
                ))}
                {patientVisits.length === 0 && !loading && (
                  <div className="text-center py-10 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-200">history_off</span>
                    <p className="text-xs italic font-medium">No previous visits.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content: Visit Detail */}
          <div className="flex-1 bg-[#fcfcfd] overflow-y-auto">
            <div className="max-w-5xl mx-auto p-10">
              {selectedVisit ? (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Summary Card */}
                  <Card 
                    title={`Visit Summary • ${new Date(selectedVisit.appointmentTime).toLocaleDateString()}`}
                    icon="description"
                    headerActions={<Badge variant="emerald">{selectedVisit.status}</Badge>}
                    noPadding
                  >
                    <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-10">
                      <div className="md:col-span-7">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Chief Complaint / Primary Concern</p>
                        <p className="text-lg font-bold text-slate-900 leading-tight">
                          {selectedVisit.notes?.split('.')[0] || 'Routine checkup and general physical examination.'}
                        </p>
                      </div>
                      <div className="md:col-span-5 flex flex-col justify-center border-l border-slate-100 pl-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center md:text-left">Recorded Vitals</p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[70px]">
                            <span className="material-symbols-outlined text-orange-600 text-sm mb-1">favorite</span>
                            <span className="font-black text-slate-900 text-sm">{selectedVisit.vitals?.heartRate || '--'}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">BPM</span>
                          </div>
                          <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[70px]">
                            <span className="material-symbols-outlined text-blue-600 text-sm mb-1">device_thermostat</span>
                            <span className="font-black text-slate-900 text-sm">{selectedVisit.vitals?.temperature || '--'}°</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Temp</span>
                          </div>
                          <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[70px]">
                            <span className="material-symbols-outlined text-emerald-600 text-sm mb-1">blood_pressure</span>
                            <span className="font-black text-slate-900 text-sm">{selectedVisit.vitals?.bloodPressure || '--'}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">B/P</span>
                          </div>
                          <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 min-w-[70px]">
                            <span className="material-symbols-outlined text-purple-600 text-sm mb-1">weight</span>
                            <span className="font-black text-slate-900 text-sm">{selectedVisit.vitals?.weight || '--'}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">KG</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Detailed Notes & Prescription */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Clinical Notes */}
                    <Card title="Clinical Findings & Diagnosis" icon="clinical_notes" className="shadow-sm">
                      <div className="space-y-6">
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
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
                              <div>
                                <p className="font-bold text-sm text-white">{item.medicineName}</p>
                                <p className="text-[10px] text-white/50 font-medium">{item.dosage} • {item.duration}</p>
                              </div>
                              <div className="text-right">
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
                          className="mt-6 text-white/60 hover:text-white hover:bg-white/10"
                        >
                          View Prescription Details
                        </Button>
                      )}
                    </Card>

                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                  <span className="material-symbols-outlined text-8xl mb-4">clinical_notes</span>
                  <p className="font-manrope text-xl font-black uppercase tracking-widest">Select a visit to view details</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};
