'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useMedicalHistory } from '@/modules/doctor/hooks/useMedicalHistory';
import { HistoryDirectoryView } from '../components/MedicalHistory/HistoryDirectoryView';
import { PatientHistoryDetailView } from '../components/MedicalHistory/PatientHistoryDetailView';

export const MedicalHistoryPage = () => {
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
          activeView={activeView}
          setActiveView={setActiveView}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          loading={loading}
          historyAppointments={historyAppointments}
          patients={patients}
          selectPatient={selectPatient}
          appointmentsPage={appointmentsPage}
          patientsPage={patientsPage}
          appointmentsTotalElements={appointmentsTotalElements}
          patientsTotalElements={patientsTotalElements}
          setAppointmentsPage={setAppointmentsPage}
          setPatientsPage={setPatientsPage}
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
