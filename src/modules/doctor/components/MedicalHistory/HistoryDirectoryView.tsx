'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { RootState } from '@/state/store';
import { AppointmentResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { PageSurface } from '@/components/ui/PageSurface';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';
import dayjs from '@/lib/dayjs';

// Clean Structure UI Style Lucid Icons Integration
import {
  History, Search, RefreshCw, Filter, ArrowLeft
} from 'lucide-react';

export const HistoryDirectoryView = () => {
  const router = useRouter();
  const { user, hospitalTimezone } = useSelector((state: RootState) => state.auth);

  // Core Operational States
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<AppointmentResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [detailedHistoryRecord, setDetailedHistoryRecord] = useState<AppointmentResponse | null>(null);
  const [loadingDetailedRecord, setLoadingDetailedRecord] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  const fetchDetailedRecord = async (appointmentId: string) => {
    setLoadingDetailedRecord(true);
    try {
      const res = await appointmentService.get(appointmentId);
      if (res.success && res.data) {
        setDetailedHistoryRecord(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch detailed record:', error);
    } finally {
      setLoadingDetailedRecord(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal && historyList.length > 0) {
      const currentRecord = historyList[currentHistoryIndex];
      if (currentRecord) {
        void fetchDetailedRecord(currentRecord.id);
      }
    }
  }, [currentHistoryIndex, historyList, showHistoryModal]);

  const handleReviewCase = async (app: AppointmentResponse) => {
    setSelectedPatientName(app.patientName);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setCurrentHistoryIndex(0);
    setDetailedHistoryRecord(null);

    try {
      const res = await appointmentService.list({
        patientId: app.patientId,
        size: 50
      });
      if (res.success && res.data) {
        const filtered = res.data.content
          .filter(a => (a.status === 'COMPLETED' || a.status === 'PRESCRIPTION_FINALIZED' || a.status === 'CONSULTATION_STARTED'))
          .sort((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime());
        setHistoryList(filtered);
        
        const idx = filtered.findIndex(h => h.id === app.id);
        if (idx !== -1) setCurrentHistoryIndex(idx);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      triggerGlobalToast('Failed to load history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const hospitalToday = useMemo(() => {
    if (!hospitalTimezone) return new Date().toISOString().split('T')[0];
    return dayjs().tz(hospitalTimezone).format('YYYY-MM-DD');
  }, [hospitalTimezone]);

  const lastMonthStr = useMemo(() => {
    if (!hospitalTimezone) {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split('T')[0];
    }
    return dayjs().tz(hospitalTimezone).subtract(1, 'month').format('YYYY-MM-DD');
  }, [hospitalTimezone]);

  const [startDate, setStartDate] = useState(lastMonthStr);
  const [endDate, setEndDate] = useState(hospitalToday);

  const handleStartDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('Start date cannot be in the future', 'warning');
      return;
    }
    setStartDate(val);
    if (endDate && val > endDate) setEndDate(val);
    setPage(0);
  };

  const handleEndDateChange = (val: string) => {
    if (!val) return;
    if (val > hospitalToday) {
      triggerGlobalToast('End date cannot be in the future', 'warning');
      return;
    }
    setEndDate(val);
    if (startDate && val < startDate) setStartDate(val);
    setPage(0);
  };

  const fetchData = useCallback(async () => {
    if (!user || !hospitalTimezone) return;

    try {
      setLoading(true);
      const fromUTC = dayjs(startDate).tz(hospitalTimezone).startOf('day').toISOString();
      const toUTC = dayjs(endDate).tz(hospitalTimezone).endOf('day').toISOString();

      const response = await appointmentService.list({
        page: 0,
        size: 1000,
        from: fromUTC,
        to: toUTC,
        doctorId: user.id
      });

      if (!response.success || !response.data) {
        setAppointments([]);
        return;
      }

      const doctorAppointments = response.data.content.filter(app =>
          app.doctorId === user.id ||
          app.doctorName.toLowerCase().includes(user.fullName.toLowerCase())
      );
      setAppointments(doctorAppointments);
    } catch (error) {
      console.error(error);
      triggerGlobalToast('Failed to fetch medical histories', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, hospitalTimezone, startDate, endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredAppointments = useMemo(() => {
    let result = appointments.filter(app => {
      const appDate = dayjs(app.appointmentTime).format('YYYY-MM-DD');
      return appDate >= startDate && appDate <= endDate;
    });

    if (statusFilter !== 'ALL') {
      result = result.filter(app => {
        const currentStatus = app.status ? app.status.toUpperCase().trim() : '';
        const targetFilter = statusFilter.toUpperCase().trim();
        return currentStatus === targetFilter;
      });
    }

    const term = searchTerm.toLowerCase().trim();
    if (term) {
      result = result.filter(app =>
          app.patientName?.toLowerCase().includes(term) ||
          app.id?.toString().toLowerCase().includes(term) ||
          app.patientCode?.toLowerCase().includes(term)
      );
    }

    return result.toSorted((a, b) => b.appointmentTime.localeCompare(a.appointmentTime));
  }, [appointments, startDate, endDate, statusFilter, searchTerm]);

  const paginatedAppointments = useMemo(() => {
    const start = page * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, page, pageSize]);

  const columns: Column<AppointmentResponse>[] = [
    {
      header: 'Date',
      render: (p) => (
          <span className="text-slate-600 font-semibold text-xs">
          {dayjs(p.appointmentTime).format('DD MMM YYYY')}
        </span>
      )
    },
    {
      header: 'Patient Profile',
      render: (p) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 font-bold uppercase text-slate-400 text-xs">
              {p.patientName.split(' ').map((name) => name[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-snug">{p.patientName}</p>
              <p className="text-[10px] text-slate-400 font-medium">PID: {p.patientCode || p.patientId || 'N/A'}</p>
            </div>
          </div>
      )
    },
    {
      header: 'Diagnosis / Chief Complaint',
      render: (p) => (
          <span className="font-medium text-slate-700 text-xs truncate max-w-[240px] inline-block">
          {p.diagnosis || p.notes || 'Routine Clinical Follow-up'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (p) => {
        const variants: Record<string, string> = {
          COMPLETED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-100',
          CONSULTATION_STARTED: 'bg-blue-50 text-blue-600 border border-blue-100',
          SCHEDULED: 'bg-slate-50 text-slate-600 border border-slate-200',
          VITALS_RECORDED: 'bg-orange-50 text-orange-600 border border-orange-100'
        };

        return (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${variants[p.status] || 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
            {p.status?.replaceAll('_', ' ') || 'COMPLETED'}
          </span>
        );
      }
    },
    {
      header: 'Action',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (p) => (
          <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => handleReviewCase(p)}
                className="px-3 py-1 bg-orange-600 text-white border border-orange-600 text-[11px] font-bold rounded-lg hover:bg-orange-700 transition-all shadow-sm"
                title="Review Full History Carousel"
            >
              Review Case
            </button>
          </div>
      )
    }
  ];

  return (
      <MainLayout title="Medical History Directory" hideTitle>
        <PageSurface
            maxWidthClassName="max-w-[1600px]"
            backgroundClassName="bg-[#F8FAFC]"
            fontClassName="font-inter"
        >
          <div className="space-y-6 p-4 md:p-8">

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push('/doctor/dashboard')}
                    className="p-2 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-500 bg-white transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">Medical History Directory</h1>
                  <p className="text-sm text-slate-500 mt-0.5">Archive list of completed diagnoses and past patient case encounters.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
                <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-50/80 rounded-xl border border-slate-100/80 flex-1 sm:flex-initial">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Start Date</span>
                    <input
                        type="date"
                        value={startDate}
                        max={hospitalToday}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">End Date</span>
                    <input
                        type="date"
                        value={endDate}
                        max={hospitalToday}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-orange-600/10 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Update
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col min-h-[550px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-600" /> Patient Encounter Logs
                </h3>

                <div className="flex items-center gap-2">
                  <div className="relative text-xs w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search history by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none font-medium text-xs text-slate-700"
                    />
                  </div>

                  <div className="relative flex items-center bg-white text-slate-600 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all px-3 py-1.5 gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0);
                        }}
                        className="bg-transparent outline-none text-xs font-bold uppercase cursor-pointer pr-1 appearance-none"
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="CONSULTATION_STARTED">IN PROGRESS</option>
                      <option value="VITALS_RECORDED">VITALS RECORDED</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto min-w-full flex-1">
                <Table
                    columns={columns}
                    data={paginatedAppointments}
                    isLoading={loading}
                    loadingMessage="Retrieving historical case logs..."
                    emptyMessage="No medical encounters found."
                    onFilter={(key, val) => setColumnFilters(prev => ({ ...prev, [key]: val }))}
                    activeFilters={columnFilters}
                />
              </div>

              <div className="border-t border-slate-50 pt-2">
                <Pagination
                    page={page}
                    totalElements={filteredAppointments.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    label="historical logs"
                />
              </div>
            </div>

          </div>
        </PageSurface>

        {showHistoryModal && (
          <Modal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            title={`Patient Clinical Archive: ${selectedPatientName}`}
            width="1100px"
          >
            <div className="flex flex-col h-[85vh] font-inter bg-slate-50">
              {loadingHistory ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Retrieving Medical Timeline...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white text-slate-300">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-20">history_off</span>
                  <p className="text-sm font-black uppercase tracking-widest">No Past Consultations Found</p>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                      <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                        <button 
                          onClick={() => setCurrentHistoryIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentHistoryIndex === 0}
                          className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all flex items-center gap-2 ${currentHistoryIndex === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-orange-600 shadow-sm hover:bg-orange-50 active:scale-95'}`}
                        >
                          <span className="material-symbols-outlined text-base">arrow_back</span> Older Records
                        </button>
                        <button 
                          onClick={() => setCurrentHistoryIndex(prev => Math.min(historyList.length - 1, prev + 1))}
                          disabled={currentHistoryIndex === historyList.length - 1}
                          className={`px-4 py-2 rounded-lg text-[11px] font-black transition-all flex items-center gap-2 ${currentHistoryIndex === historyList.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-orange-600 shadow-sm hover:bg-orange-50 active:scale-95'}`}
                        >
                          Newer <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Viewing History</span>
                        <span className="text-[11px] font-black text-slate-600">Case {currentHistoryIndex + 1} of {historyList.length}</span>
                      </div>
                    </div>
                    
                    {detailedHistoryRecord && (
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Encounter Date</span>
                        <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{dayjs(detailedHistoryRecord.appointmentTime).format('DD MMMM YYYY')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-slate-50/50 no-scrollbar scroll-smooth">
                    {loadingDetailedRecord ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Reconstructing Medical Document...</p>
                      </div>
                    ) : detailedHistoryRecord ? (
                      <div className="bg-white border border-slate-200 shadow-xl rounded-xl max-w-5xl mx-auto flex flex-col animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                        {/* Document Header - Simplified */}
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                          <div className="space-y-0.5">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">LAARA HMS</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CENTER FOR ADVANCED HEALTHCARE</p>
                            <div className="mt-2 flex items-center gap-2">
                               <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Dr. {detailedHistoryRecord.doctorName}</span>
                               <span className="text-[8px] font-bold text-orange-300">•</span>
                               <span className="text-[9px] font-bold text-orange-500 uppercase italic tracking-tight">{detailedHistoryRecord.departmentName || 'Consulting Physician'}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                             <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-slate-900/20">
                                <span className="material-symbols-outlined text-2xl">medical_services</span>
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Official Record</span>
                          </div>
                        </div>

                        {/* Patient Summary Row - Clean & Simple */}
                        <div className="px-10 py-4 flex justify-between items-center gap-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                          <div className="flex items-center gap-8">
                             <div>
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-0.5 group-hover:text-orange-400 transition-colors">Patient Name</span>
                               <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{detailedHistoryRecord.patientName}</span>
                             </div>
                             <div className="w-px h-6 bg-slate-200"></div>
                             <div>
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-0.5">UHID (System ID)</span>
                               <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">{detailedHistoryRecord.patientCode || 'PT-ARCHIVE'}</span>
                             </div>
                          </div>
                          <div className="text-right hidden sm:block">
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em] block mb-0.5">Encounter Time</span>
                             <span className="text-xs font-black text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-100">{dayjs(detailedHistoryRecord.appointmentTime).format('hh:mm A')}</span>
                          </div>
                        </div>

                        {/* Vitals Dashboard Grid */}
                        <div className="p-10 grid grid-cols-5 gap-4 border-b border-slate-100 bg-white">
                          {[
                            { label: 'Heart Rate', value: detailedHistoryRecord.vitals?.heartRate, unit: 'bpm' },
                            { label: 'Temperature', value: detailedHistoryRecord.vitals?.temperature, unit: '°F' },
                            { label: 'Weight', value: detailedHistoryRecord.vitals?.weight, unit: 'kg' },
                            { label: 'Blood Pressure', value: detailedHistoryRecord.vitals?.bloodPressure, unit: 'mmHg' },
                            { label: 'Oxygen Level', value: detailedHistoryRecord.vitals?.oxygenLevel, unit: '%' }
                          ].map((v, i) => (
                            <div key={i} className="flex flex-col text-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{v.label}</span>
                              <div className="flex items-baseline justify-center gap-0.5">
                                <span className="text-[20px] font-black text-slate-900 leading-none">{v.value || '--'}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{v.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Clinical Observations Section */}
                        <div className="flex-1 p-10 space-y-10 bg-white overflow-y-auto">
                          {/* Summary Row: Complaints & Diagnosis */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 divide-x divide-slate-100">
                            <section className="space-y-2">
                               <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1 h-1 bg-slate-400 rounded-full"></span> Chief Complaints
                               </h3>
                               <div className="text-[13px] font-medium text-slate-600 leading-relaxed min-h-[80px] italic">
                                  {detailedHistoryRecord.chiefComplaints || detailedHistoryRecord.notes || 'No specific complaints recorded.'}
                               </div>
                            </section>
                            <section className="pl-10 space-y-2">
                               <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1 h-1 bg-orange-500 rounded-full"></span> Final Diagnosis
                               </h3>
                               <div className="text-[14px] font-black text-slate-900 leading-relaxed uppercase tracking-tight">
                                  {detailedHistoryRecord.diagnosis || 'Diagnosis Pending Evaluation.'}
                               </div>
                            </section>
                          </div>

                          {/* Medications Management Table */}
                          <section className="space-y-3">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                              <span className="material-symbols-outlined text-orange-600 text-sm">medication</span> Prescribed Medications
                            </h3>
                            <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                               <table className="w-full text-left border-collapse">
                                  <thead>
                                     <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Medicine & Dosage</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Frequency</th>
                                        <th className="px-6 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Duration</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                     {detailedHistoryRecord.prescription?.items && detailedHistoryRecord.prescription.items.length > 0 ? (
                                        detailedHistoryRecord.prescription.items.map((med, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5">
                                              <div className="text-[13px] font-black text-slate-900">{med.medicineName}</div>
                                              <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter italic">Clinical advice included</div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                               <span className="text-[11px] font-black text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-100 inline-block min-w-[70px] tracking-wider">{med.dosage}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{med.duration}</span>
                                            </td>
                                          </tr>
                                        ))
                                     ) : (
                                        <tr>
                                           <td colSpan={3} className="px-8 py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No active pharmacological interventions</td>
                                        </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                          </section>

                          {/* Laboratory Diagnostics Section */}
                          {detailedHistoryRecord.prescription?.labItems && detailedHistoryRecord.prescription.labItems.length > 0 && (
                            <section className="space-y-4">
                               <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                                 <span className="material-symbols-outlined text-blue-600 text-sm">biotech</span> Laboratory Investigations
                               </h3>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {detailedHistoryRecord.prescription.labItems.map((lab, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col gap-1 hover:bg-white hover:shadow-sm transition-all">
                                       <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{lab.testName}</span>
                                       {lab.notes && (
                                         <div className="mt-1 border-t border-slate-200/60 pt-1">
                                            <span className="text-[9px] font-medium text-slate-400 italic leading-relaxed">Note: {lab.notes}</span>
                                         </div>
                                       )}
                                    </div>
                                  ))}
                               </div>
                            </section>
                          )}
                        </div>

                        {/* Formal Footer & Signature */}
                        <div className="p-8 border-t border-slate-100 flex justify-between items-end bg-slate-50/30 shrink-0">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clinical Protocol</p>
                             <div className="text-[10px] font-bold text-slate-600 max-w-sm">
                                Patient advised to review with reports as scheduled. Strictly follow physician instructions.
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="h-px w-48 bg-slate-300 mb-2 ml-auto opacity-50"></div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Digitally Signed By</p>
                             <p className="text-[10px] font-bold text-orange-600 mt-2 uppercase italic">Dr. {detailedHistoryRecord.doctorName}</p>
                             <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Clinical Authentication Record</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-white border border-slate-200 rounded-3xl text-slate-300">
                        <p className="text-xs font-black uppercase tracking-[0.4em] italic">Data Stream Interrupted</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </MainLayout>
  );
};
