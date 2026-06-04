'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { useMedicalHistory } from '@/modules/doctor/hooks/useMedicalHistory';
import { HistoryDirectoryView } from '../components/MedicalHistory/HistoryDirectoryView';
import { PatientHistoryDetailView } from '../components/MedicalHistory/PatientHistoryDetailView';

export const MedicalHistoryPage = () => {
  const {
    patientId,
    selectedPatient,
    patientVisits,
    selectedVisit,
    loading,
    handleSelectVisit,
    clearSelection
  } = useMedicalHistory();

  if (!patientId) {
    return (
      <HistoryDirectoryView />
    );
  }

  return (
    <MainLayout title="Patient Medical History" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PatientHistoryDetailView 
            selectedPatient={selectedPatient}
            patientVisits={patientVisits}
            selectedVisit={selectedVisit}
            loading={loading}
            clearSelection={clearSelection}
            handleSelectVisit={handleSelectVisit}
          />
        </div>
      </PageSurface>
    </MainLayout>
  );
};
