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
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { AddProgressNoteModal } from '../components/AddProgressNoteModal';

export const AdmissionDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { isSuperMode, activeRole, user } = useSelector((state: RootState) => state.auth);

  const {
    admission,
    transfers,
    progressNotes,
    loading,
    notesLoading,
    fetchDetails,
    fetchTransfers,
    fetchProgressNotes,
    addProgressNote
  } = useAdmissionDetails(id as string);

  const showProgressNotesSection = activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN' && !isSuperMode;
  const isDoctor = activeRole === 'DOCTOR';
  const showAddNoteButton = isDoctor && admission?.status === 'ADMITTED';

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransfers();
    if (showProgressNotesSection) {
      await fetchProgressNotes();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDetails();
    fetchTransfers();
    if (showProgressNotesSection) {
      fetchProgressNotes();
    }
  }, [fetchDetails, fetchTransfers, fetchProgressNotes, showProgressNotesSection]);

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

            {showProgressNotesSection && (
              <div className="md:col-span-2">
                <div className="bg-white border border-slate-100 rounded-xl p-6 md:p-8 space-y-5 md:space-y-6 shadow-sm transition-all">
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
                        <span className="material-symbols-outlined text-xl md:text-2xl">clinical_notes</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-[13px] md:text-sm text-slate-800 uppercase tracking-wider">Progress Notes</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight mt-0.5">
                          Daily progress notes recorded by the consulting doctor.
                        </p>
                      </div>
                    </div>
                    {showAddNoteButton && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon="add" 
                        onClick={() => setIsNoteModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 shadow-md whitespace-nowrap"
                      >
                        Add Progress Note
                      </Button>
                    )}
                  </div>

                  {/* Progress Notes Timeline */}
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  ) : progressNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                      <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">clinical_notes</span>
                      <h3 className="text-lg font-medium text-slate-800">No Progress Notes</h3>
                      <p className="text-sm text-slate-400 mt-1">No progress notes have been recorded for this admission yet.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
                      {progressNotes.map((note) => (
                        <div key={note.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1 bg-orange-600 w-3.5 h-3.5 rounded-full border-2 border-white ring-4 ring-orange-50"></div>
                          
                          <div className="flex flex-col bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-slate-700">Dr. {note.doctorName}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                {dayjs(note.createdAt).format('DD MMM YYYY - hh:mm A')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 whitespace-pre-line mt-1">
                              {note.note}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                      <thead>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">From Location</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">To Location</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Reason</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Remarks</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Transferred By</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Transferred At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transfers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* From Location */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              <div className="font-semibold text-slate-800">{t.fromWardName}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">Bed {t.fromBedNumber}</div>
                            </div></td>
                            {/* To Location */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              <div className="font-semibold text-slate-800">{t.toWardName}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">Bed {t.toBedNumber}</div>
                            </div></td>
                            {/* Reason */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              {t.transferReason ? (
                                <Badge variant="slate">{t.transferReason}</Badge>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div></td>
                            {/* Remarks */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              {t.remarks || <span className="text-slate-400">-</span>}
                            </div></td>
                            {/* Transferred By */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              <div className="font-semibold text-slate-800">
                                {t.transferredByName ? `Dr. ${t.transferredByName}` : t.transferredBy}
                              </div>
                            </div></td>
                            {/* Transferred At */}
                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                              <div className="font-semibold text-slate-800">
                                {dayjs(t.transferredAt).format('DD MMM YYYY')}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {dayjs(t.transferredAt).format('hh:mm A')}
                              </div>
                            </div></td>
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

      {admission && isNoteModalOpen && (
        <AddProgressNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          onSubmit={addProgressNote}
        />
      )}
    </MainLayout>
  );
};
