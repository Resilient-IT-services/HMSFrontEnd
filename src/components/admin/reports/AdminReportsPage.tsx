'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { reportService, ReportRow, ReportType } from '@/services/reportService';
import { DoctorStaffResponse, HospitalResponse } from '@/types/api';

const reportTypeOptions: Array<{ label: string; value: ReportType }> = [
  { label: 'Doctor-wise Revenue', value: 'DOCTOR_REVENUE' },
  { label: 'Payment Mode Summary', value: 'PAYMENT_SUMMARY' }
];

const revenueKeys = ['revenue', 'totalRevenue', 'totalAmount', 'amount', 'paidAmount', 'netAmount', 'subtotal'];

const titleCase = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());

const today = () => new Date().toISOString().slice(0, 10);

const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replaceAll(',', ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getDisplayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('DOCTOR_REVENUE');
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaffResponse[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [error, setError] = useState('');

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === hospitalId),
    [hospitalId, hospitals]
  );

  const doctorOptions = useMemo(() => {
    const optionMap = new Map<string, DoctorStaffResponse>();
    for (const doctor of doctors) {
      optionMap.set(doctor.doctorId || doctor.userId, doctor);
    }
    return [...optionMap.values()].toSorted((a, b) => a.fullName.localeCompare(b.fullName));
  }, [doctors]);

  const selectedDoctor = useMemo(
    () => doctorOptions.find((doctor) => (doctor.doctorId || doctor.userId) === doctorId),
    [doctorId, doctorOptions]
  );

  const filters = useMemo(
    () => ({ type: reportType, startDate, endDate, ...(hospitalId ? { hospitalId } : {}), ...(doctorId ? { doctorId } : {}) }),
    [reportType, startDate, endDate, hospitalId, doctorId]
  );

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    return [...keys];
  }, [rows]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    for (const row of rows) {
      const key = revenueKeys.find((candidate) => row[candidate] !== undefined);
      totalRevenue += key ? toNumber(row[key]) : 0;
    }

    return {
      totalRevenue,
      recordCount: rows.length,
      averageRevenue: rows.length > 0 ? totalRevenue / rows.length : 0
    };
  }, [rows]);

  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (!hospitalId) {
        if (hospitals.length === 0) {
          setRows([]);
          return;
        }

        const responses = await Promise.all(
          hospitals.map(async (hospital) => {
            try {
              const response = await reportService.preview({ ...filters, hospitalId: hospital.id });
              return {
                hospital,
                response
              };
            } catch (e) {
              return { hospital, response: { success: false, message: 'Failed' } };
            }
          })
        );
        const mergedRows = responses.flatMap(({ hospital, response }) =>
          response && response.success
            ? (response.data ?? []).map((row) => ({
                hospitalName: row.hospitalName ?? hospital.name,
                hospitalCode: row.hospitalCode ?? hospital.code,
                ...row
              }))
            : []
        );
        setRows(mergedRows);

        if (mergedRows.length === 0 && responses.some(({ response }) => !response || !response.success)) {
          setError('Unable to load report data for one or more hospitals.');
        }
      } else {
        const response = await reportService.preview(filters);
        setRows(response.success ? response.data ?? [] : []);
        if (!response.success) {
          setError(response.error?.message || response.message || 'Unable to load report data.');
        }
      }
    } catch (fetchError) {
      console.error(fetchError);
      setRows([]);
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  }, [filters, hospitalId, hospitals]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const response = await hospitalService.list(0, 500);
        setHospitals(response.success ? response.data?.content ?? [] : []);
      } catch (hospitalError) {
        console.error(hospitalError);
        setHospitals([]);
        setError('Unable to load hospitals for report filter.');
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setDoctorId('');

        if (!hospitalId) {
          if (hospitals.length === 0) {
            setDoctors([]);
            return;
          }
          const responses = await Promise.all(
            hospitals.map(async (hospital) => {
              try {
                const response = await reportService.listDoctors(hospital.id);
                return response.success ? response.data?.content ?? [] : [];
              } catch (e) {
                return [];
              }
            })
          );
          setDoctors(responses.flat());
        } else {
          const response = await reportService.listDoctors(hospitalId);
          setDoctors(response.success ? response.data?.content ?? [] : []);
        }
      } catch (doctorError) {
        console.error(doctorError);
        setDoctors([]);
        setError('Unable to load doctors for report filter.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [hospitalId, hospitals]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(format);
      const blob = format === 'pdf' ? await reportService.exportPdf(filters) : await reportService.exportExcel(filters);
      downloadBlob(blob, `reports-${reportType.toLowerCase()}-${startDate}-to-${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (exportError) {
      console.error(exportError);
      setError(`Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <MainLayout title="Reports" hideTitle>
      <div className="min-h-screen bg-[#f7f9fb] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Super Admin</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-orange-700">Reports</span>
              </div>
              <h1 className="font-manrope text-3xl font-bold text-slate-900">System Reports</h1>
              <p className="mt-1 text-sm text-slate-500">Analyze all hospitals or one hospital using live revenue data.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">cloud_download</span>
                {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Hospital
                <select
                  value={hospitalId}
                  onChange={(event) => setHospitalId(event.target.value)}
                  disabled={loadingHospitals}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">All Hospitals</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} {hospital.code ? `(${hospital.code})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Doctor
                <select
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  disabled={loadingDoctors}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">All Doctors</option>
                  {doctorOptions.map((doctor) => {
                    const value = doctor.doctorId || doctor.userId;
                    return (
                      <option key={value} value={value}>
                        {doctor.fullName} {doctor.departmentName ? `(${doctor.departmentName})` : ''}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Report Type
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value as ReportType)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
                >
                  {reportTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                End Date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={fetchPreview}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">query_stats</span>
                  {loading ? 'Loading...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Revenue</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {stats.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Calculated from API response fields.</p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Report Records</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{stats.recordCount.toLocaleString('en-IN')}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedHospital ? selectedHospital.name : 'All Hospitals'} / {selectedDoctor ? selectedDoctor.fullName : 'All Doctors'}
              </p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Average Revenue</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                {stats.averageRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </h2>
              <p className="mt-1 text-xs text-slate-500">Based on current filters.</p>
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-manrope text-xl font-bold text-slate-900">Report Preview</h2>
                <p className="text-sm text-slate-500">
                  {selectedHospital ? selectedHospital.name : 'All Hospitals'} / {selectedDoctor ? selectedDoctor.fullName : 'All Doctors'} - {startDate} to {endDate}
                </p>
              </div>
              {loading && <span className="text-sm font-semibold text-orange-700">Fetching latest data...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    {(columns.length > 0 ? columns : ['report']).map((column) => (
                      <th key={column} className="px-5 py-3">
                        {titleCase(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {rows.map((row, index) => (
                    <tr key={`${reportType}-${index}`} className="hover:bg-slate-50">
                      {columns.map((column) => (
                        <td key={column} className="px-5 py-4 font-medium">
                          {getDisplayValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td className="px-5 py-12 text-center text-slate-400" colSpan={Math.max(columns.length, 1)}>
                        No report data found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
