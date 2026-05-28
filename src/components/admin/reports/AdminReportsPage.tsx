'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { reportService, ReportRow, ReportType } from '@/services/reportService';
import { DoctorStaffResponse, HospitalResponse, HospitalSelectionDTO } from '@/types/api';
import dayjs from '@/lib/dayjs';
import { PageSurface } from '@/components/ui/PageSurface';

const reportTypeOptions: Array<{ label: string; value: ReportType }> = [
  { label: 'Doctor-wise Revenue', value: 'DOCTOR_REVENUE' },
  { label: 'Pharmacy Revenue', value: 'PHARMACY_REVENUE' },
  { label: 'Payment Mode Summary', value: 'PAYMENT_SUMMARY' },
  { label: 'Staff Collection Summary', value: 'PAYMENT_COLLECTOR_SUMMARY' }
];

const revenueKeys = ['revenue', 'totalRevenue', 'totalAmount', 'amount', 'paidAmount', 'netAmount', 'subtotal'];

const titleCase = (value: string) =>
  value
    .replaceAll('_', ' ')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());

const getToday = () => dayjs().format('YYYY-MM-DD');

const getMonthStart = () => dayjs().startOf('month').format('YYYY-MM-DD');

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
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getToday);
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [hospitals, setHospitals] = useState<HospitalSelectionDTO[]>([]);
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

  const getRangeForHospital = useCallback(async (hId: string) => {
    try {
      const res = await hospitalService.getById(hId);
      if (res.success && res.data) {
        const tz = res.data.timezone || 'UTC';
        return {
          from: dayjs(startDate).tz(tz).startOf('day').toISOString(),
          to: dayjs(endDate).tz(tz).endOf('day').toISOString()
        };
      }
    } catch (error_) {
      console.error('Error fetching hospital for timezone:', error_);
    }
    return {
      from: dayjs(startDate).startOf('day').toISOString(),
      to: dayjs(endDate).endOf('day').toISOString()
    };
  }, [startDate, endDate]);

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

      if (hospitalId) {
        const { from, to } = await getRangeForHospital(hospitalId);
        const response = await reportService.preview({
          type: reportType,
          from,
          to,
          hospitalId,
          ...(doctorId ? { doctorId } : {})
        });
        setRows(response.success ? response.data ?? [] : []);
        if (!response.success) {
          setError(response.error?.message || response.message || 'Unable to load report data.');
        }
      } else {
        const fromUTC = dayjs(startDate).startOf('day').toISOString();
        const toUTC = dayjs(endDate).endOf('day').toISOString();
        
        const response = await reportService.preview({
          type: reportType,
          from: fromUTC,
          to: toUTC,
          allHospitals: true,
          ...(doctorId ? { doctorId } : {})
        });

        if (response.success) {
          setRows(response.data ?? []);
        } else {
          setError(response.error?.message || response.message || 'Unable to load combined report data.');
        }
      }
    } catch (fetchError) {
      console.error(fetchError);
      setRows([]);
      setError('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  }, [hospitalId, reportType, doctorId, getRangeForHospital, startDate, endDate]);

  useEffect(() => {
    const trigger = async () => {
      await fetchPreview();
    };
    void trigger();
  }, [fetchPreview]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const response = await hospitalService.getHospitalsSelection();
        setHospitals(response.success ? response.data ?? [] : []);
      } catch (hospitalError) {
        console.error(hospitalError);
        setHospitals([]);
        setError('Unable to load hospitals for report filter.');
      } finally {
        setLoadingHospitals(false);
      }
    };

    const trigger = async () => {
      await fetchHospitals();
    };
    void trigger();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        setDoctorId('');

        if (hospitalId) {
          const response = await reportService.listDoctors(hospitalId);
          setDoctors(response.success ? response.data?.content ?? [] : []);
        } else {
          if (hospitals.length === 0) {
            setDoctors([]);
            return;
          }
          const responses = await Promise.all(
            hospitals.map(async (hospital) => {
              try {
                const response = await reportService.listDoctors(hospital.id);
                return response.success ? response.data?.content ?? [] : [];
              } catch {
                return [];
              }
            })
          );
          setDoctors(responses.flat());
        }
      } catch (doctorError) {
        console.error(doctorError);
        setDoctors([]);
        setError('Unable to load doctors for report filter.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    const trigger = async () => {
      await fetchDoctors();
    };
    void trigger();
  }, [hospitalId, hospitals]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      if (startDate && endDate && startDate > endDate) {
        setError('Start date cannot be greater than end date');
        return;
      }

      setExporting(format);
      setError('');

      if (!hospitalId) {
        if (rows.length === 0) {
          setError('Please generate the report first to export "All Hospitals" data.');
          setExporting(null);
          return;
        }

        if (format === 'excel') {
          const header = columns.map(titleCase).join(',');
          const csvRows = rows.map((row) =>
            columns
              .map((col) => {
                const val = row[col];
                const stringVal = val === null || val === undefined ? '' : String(val);
                return `"${stringVal.replaceAll('"', '""')}"`;
              })
              .join(',')
          );
          const csvContent = '\uFEFF' + [header, ...csvRows].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          downloadBlob(blob, `all-hospitals-${reportType.toLowerCase()}-${startDate}-to-${endDate}.csv`);
        } else {
          globalThis.print();
        }
        setExporting(null);
        return;
      }

      const { from, to } = await getRangeForHospital(hospitalId);
      const filtersWithUTC = { type: reportType, from, to, hospitalId, ...(doctorId ? { doctorId } : {}) };

      const blob = format === 'pdf' ? await reportService.exportPdf(filtersWithUTC) : await reportService.exportExcel(filtersWithUTC);
      const filename = `report-${reportType.toLowerCase()}-${startDate}-to-${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadBlob(blob, filename);
    } catch (exportError) {
      console.error(exportError);
      setError(`Unable to export ${format.toUpperCase()} report.`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <MainLayout title="Reports" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="py-4 md:py-8 space-y-6 print:bg-white print:p-0">
          {/* Professional Print Header & Summary */}
          <div className="hidden print:block mb-6 w-full">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">System Revenue Report</h1>
                <p className="text-sm text-slate-500 mt-1">Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">VitalSync HMS Enterprise</p>
                <p className="text-sm font-semibold text-slate-900">All Hospitals Combined Data</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Report Type</p>
                <p className="text-sm font-bold text-slate-900">{reportTypeOptions.find(o => o.value === reportType)?.label}</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Period</p>
                <p className="text-sm font-bold text-slate-900">{startDate} to {endDate}</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Revenue</p>
                <p className="text-sm font-bold text-slate-900">{stats.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Records</p>
                <p className="text-sm font-bold text-slate-900">{stats.recordCount}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 print:m-0 print:max-w-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between no-print">
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

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm no-print">
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
                        {hospital.name}
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
                      const departmentLabel = doctor.departments?.filter(Boolean).join(', ');
                      return (
                        <option key={value} value={value}>
                          {doctor.fullName} {departmentLabel ? `(${departmentLabel})` : ''}
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
                    onChange={(event) => {
                      const val = event.target.value;
                      if (endDate && val > endDate) {
                        setError('Start date cannot be greater than end date');
                        return;
                      }
                      setError('');
                      setStartDate(val);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  End Date
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      const val = event.target.value;
                      if (startDate && val < startDate) {
                        setError('End date cannot be less than start date');
                        return;
                      }
                      setError('');
                      setEndDate(val);
                    }}
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
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 no-print">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 no-print">
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

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm print:border-slate-800 print:rounded-none">
              <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between no-print">
                <div>
                  <h2 className="font-manrope text-xl font-bold text-slate-900">Report Preview</h2>
                  <p className="text-sm text-slate-500">
                    {selectedHospital ? selectedHospital.name : 'All Hospitals'} / {selectedDoctor ? selectedDoctor.fullName : 'All Doctors'} - {startDate} to {endDate}
                  </p>
                </div>
                {loading && <span className="text-sm font-semibold text-orange-700">Fetching latest data...</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left border-collapse print:min-w-0">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 print:bg-slate-100 print:text-slate-900 print:border-b-2 print:border-slate-800">
                    <tr>
                      {(columns.length > 0 ? columns : ['report']).map((column) => (
                        <th key={column} className="px-5 py-3 border-b border-slate-100 print:border-slate-300">
                          {titleCase(column)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700 print:divide-slate-300">
                    {rows.map((row, index) => (
                      <tr key={`${reportType}-${index}`} className="hover:bg-slate-50 print:hover:bg-transparent">
                        {columns.map((column) => (
                          <td key={column} className="px-5 py-4 font-medium print:py-2 print:px-3 print:border-b print:border-slate-200">
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
      </PageSurface>
    </MainLayout>
  );
}
