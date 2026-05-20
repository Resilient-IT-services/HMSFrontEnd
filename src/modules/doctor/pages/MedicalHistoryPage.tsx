'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useMedicalHistory } from '@/modules/doctor/hooks/useMedicalHistory';
import { HistoryDirectoryView } from '../components/MedicalHistory/HistoryDirectoryView';
import { PatientHistoryDetailView } from '../components/MedicalHistory/PatientHistoryDetailView';

export const MedicalHistoryPage = () => {
  const {
    patientId,
    historyAppointments,
    patientDetails,
    selectedPatient,
    patientVisits,
    selectedVisit,
    loading,
    searchTerm,
    setSearchTerm,
    appointmentsPage,
    setAppointmentsPage,
    appointmentsTotalElements,
    pageSize,
    setPageSize,
    handleSearch,
    selectPatient,
    handleSelectVisit,
    clearSelection
  } = useMedicalHistory();

  if (!patientId) {
    return (
      <MainLayout title="Medical History" hideTitle>
        <HistoryDirectoryView 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          loading={loading}
          historyAppointments={historyAppointments}
          patientDetails={patientDetails}
          selectPatient={selectPatient}
          appointmentsPage={appointmentsPage}
          appointmentsTotalElements={appointmentsTotalElements}
          setAppointmentsPage={setAppointmentsPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Patient Medical History" hideTitle>
      <PatientHistoryDetailView 
        selectedPatient={selectedPatient}
        patientVisits={patientVisits}
        selectedVisit={selectedVisit}
        loading={loading}
        clearSelection={clearSelection}
        handleSelectVisit={handleSelectVisit}
      />
    </MainLayout>
  );
};
