'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ipdService } from '@/services/ipdService';
import { AdmissionResponseDTO } from '@/types/ipd';
import { formatDateTime } from '@/utils/formatters';
import { ADMISSION_STATUS_OPTIONS } from '@/utils/enumOptions';
import { Section } from '@/components/ui/Section';
import { InfoRow } from '@/components/ui/InfoRow';

export const AdmissionDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const [admission, setAdmission] = useState<AdmissionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        const res = await ipdService.getAdmission(id as string);
        if (res.success && res.data) {
          setAdmission(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch admission details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

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
              <Button variant="secondary" size="sm" icon="arrow_back" onClick={() => router.push('/ipd/admissions')}>
                Back to List
              </Button>
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
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
};
