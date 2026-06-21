'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/utils/formatters';
import { ADMISSION_STATUS_OPTIONS } from '@/utils/enumOptions';
import { Section } from '@/components/ui/Section';
import { InfoRow } from '@/components/ui/InfoRow';
import { TransferBedModal } from '../components/TransferBedModal';
import { useAdmissionDetails } from '../hooks/useAdmissionDetails';
import dayjs from '@/lib/dayjs';

export const AdmissionDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    admission,
    transfers,
    loading,
    fetchDetails,
    fetchTransfers
  } = useAdmissionDetails(id as string);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDetails();
    fetchTransfers();
  }, [fetchDetails, fetchTransfers]);

  if (loading) {
    return (
      <MainLayout title="Admission Details">
        <PageSurface>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </PageSurface>
      </MainLayout>
    );
  }

  if (!admission) {
    return (
      <MainLayout title="Admission Details">
        <PageSurface>
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-slate-900">Admission not found</h2>
            <Button className="mt-4" onClick={() => router.push('/ipd/admissions')}>Back to List</Button>
          </div>
        </PageSurface>
      </MainLayout>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ADMITTED': { return 'orange'; }
      case 'DISCHARGED': { return 'emerald'; }
      case 'CANCELLED': { return 'red'; }
      default: { return 'slate'; }
    }
  };

  return (
    <MainLayout title={`Admission: ${admission.admissionNumber}`}>
      <PageSurface>
        <div className="space-y-6 py-6">
          <PageHeader 
            title="Admission Details"
            headerActions={
              <div className="flex gap-2">
                {admission.status === 'ADMITTED' && (
                  <Button variant="primary" size="sm" icon="swap_horiz" onClick={() => setIsTransferModalOpen(true)}>
                    Transfer Bed
                  </Button>
                )}
                <Button variant="secondary" size="sm" icon="arrow_back" onClick={() => router.push('/ipd/admissions')}>
                  Back to List
                </Button>
              </div>
            }
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{admission.admissionNumber}</h2>
                <p className="text-slate-500 text-xs">Review patient admission information</p>
              </div>
            </div>
            <Badge variant={getStatusVariant(admission.status)}>
              {ADMISSION_STATUS_OPTIONS.find(o => o.value === admission.status)?.label || admission.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Patient Information" icon="person">
              <div className="space-y-3">
                <InfoRow label="Patient Name" value={admission.patientName} />
                <InfoRow label="Patient ID" value={admission.patientId} />
              </div>
            </Section>

            <Section title="Admission Information" icon="event">
              <div className="space-y-3">
                <InfoRow label="Admission #" value={admission.admissionNumber} />
                <InfoRow label="Admission Date" value={formatDateTime(admission.admissionDateTime)} />
              </div>
            </Section>

            <Section title="Location Information" icon="hotel">
              <div className="space-y-3">
                <InfoRow label="Ward" value={admission.wardName} />
                <InfoRow label="Bed" value={`Bed ${admission.bedNumber}`} />
              </div>
            </Section>

            <Section title="Doctor Information" icon="medical_services">
              <div className="space-y-3">
                <InfoRow label="Consulting Doctor" value={`Dr. ${admission.doctorName}`} />
              </div>
            </Section>

            <div className="md:col-span-2">
              <Section title="Clinical Information" icon="clinical_notes">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admission Reason</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                      {admission.admissionReason || 'No reason provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                      {admission.remarks || 'No remarks'}
                    </p>
                  </div>
                </div>
              </Section>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 space-y-5 md:space-y-6 shadow-sm transition-all">
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
                      <span className="material-symbols-outlined text-xl md:text-2xl">swap_horiz</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] md:text-sm text-slate-800 uppercase tracking-wider">Transfer History</h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">
                        Complete history of bed transfers for this admission.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    icon="refresh" 
                    isLoading={refreshing} 
                    onClick={handleRefresh}
                  >
                    Refresh
                  </Button>
                </div>

                {/* Table or Empty State Content */}
                {transfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                    <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">swap_horiz</span>
                    <h3 className="text-lg font-medium text-slate-800">No Transfer History</h3>
                    <p className="text-sm text-slate-400 mt-1">This patient has not been transferred between beds yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">From Location</th>
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">To Location</th>
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Reason</th>
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Remarks</th>
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Transferred By</th>
                          <th className="py-3 px-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">Transferred At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* From Location */}
                            <td className="py-4 px-4 align-top text-xs font-medium text-slate-600">
                              <div className="font-semibold text-slate-800">{t.fromWardName}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">Bed {t.fromBedNumber}</div>
                            </td>
                            {/* To Location */}
                            <td className="py-4 px-4 align-top text-xs font-medium text-slate-600">
                              <div className="font-semibold text-slate-800">{t.toWardName}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">Bed {t.toBedNumber}</div>
                            </td>
                            {/* Reason */}
                            <td className="py-4 px-4 align-top text-xs font-medium">
                              {t.transferReason ? (
                                <Badge variant="slate">{t.transferReason}</Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            {/* Remarks */}
                            <td className="py-4 px-4 align-top text-xs font-medium text-slate-600 whitespace-normal break-words max-w-[200px]">
                              {t.remarks || <span className="text-slate-400">-</span>}
                            </td>
                            {/* Transferred By */}
                            <td className="py-4 px-4 align-top text-xs font-medium text-slate-600">
                              <div className="font-semibold text-slate-800">
                                {t.transferredByName ? `Dr. ${t.transferredByName}` : t.transferredBy}
                              </div>
                            </td>
                            {/* Transferred At */}
                            <td className="py-4 px-4 align-top text-xs font-medium text-slate-600">
                              <div className="font-semibold text-slate-800">
                                {dayjs(t.transferredAt).format('DD MMM YYYY')}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {dayjs(t.transferredAt).format('hh:mm A')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageSurface>
      
      {admission && isTransferModalOpen && (
        <TransferBedModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            fetchDetails();
            fetchTransfers();
          }}
          admission={admission}
        />
      )}
    </MainLayout>
  );
};
