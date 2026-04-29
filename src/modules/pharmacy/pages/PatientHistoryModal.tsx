'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { patientService } from '@/services/patientService';
import { AppointmentResponse, PrescriptionDTO } from '@/types/api';
import { Modal } from '@/components/ui/Modal';
import HistoryTimeline from '../components/HistoryTimeline';
import LoadingSkeleton from '../components/LoadingSkeleton';

interface PatientHistoryModalProps {
  patientId: string;
  onClose: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patientId, onClose }) => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Using patientService.getFullHistory or multiple calls
        const response = await patientService.getFullHistory(patientId);
        if (response.success && response.data) {
          setAppointments(response.data.visits || []);
          // Note: The patientHistoryDTO might not have prescriptions directly in the same way
          // If not, we could fetch them separately
          const rxResponse = await patientService.getPrescriptions(patientId);
          if (rxResponse.success && rxResponse.data) {
            setPrescriptions(rxResponse.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch patient history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Patient Medical History">
      <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <HistoryTimeline appointments={appointments} prescriptions={prescriptions} />
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-[var(--border)] mt-4">
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-gray-100 text-[var(--text-primary)] rounded-lg font-semibold hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default PatientHistoryModal;
