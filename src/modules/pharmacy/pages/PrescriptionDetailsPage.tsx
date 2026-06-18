'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pharmacyApi } from '../api/pharmacyApi';
import { PrescriptionDTO, PatientResponse } from '@/types/api';
import PatientInfoCard from '../components/PatientInfoCard';
import MedicineTable from '../components/MedicineTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import PatientProfileModal from './PatientProfileModal';
import PatientHistoryModal from './PatientHistoryModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { formatRxNumber } from '@/utils/formatters';

const PrescriptionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const hospitalName = user?.memberships?.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName;
  
  const [prescription, setPrescription] = useState<PrescriptionDTO | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const rxResponse = await pharmacyApi.getPrescriptionById(id);
        if (rxResponse.success && rxResponse.data) {
          setPrescription(rxResponse.data);
          
          if (rxResponse.data.patientId) {
            const pResponse = await pharmacyApi.getPatientById(rxResponse.data.patientId);
            if (pResponse.success && pResponse.data) {
              setPatient(pResponse.data);
            }
          }
        } else {
          setError(rxResponse.message || 'Prescription not found');
        }
      } catch (error_) {
        setError('Failed to load prescription details');
        console.error(error_);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDispense = async () => {
    if (!prescription?.id) return;
    router.push(`/pharmacy/sales?prescriptionId=${prescription.id}`);
  };

  const handlePrint = () => {
    globalThis.print();
  };

  if (loading) return <div className="p-8"><LoadingSkeleton /></div>;
  if (error || !prescription) return <div className="p-8"><EmptyState message={error || 'Not found'} icon="error" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dispense Medicines</h1>
          <p className="text-[var(--text-secondary)]">Order Ref: <span className="font-semibold text-[var(--text-primary)]">{formatRxNumber(prescription.prescriptionNumber, prescription.id, prescription.createdAt, hospitalName)}</span></p>
        </div>
        <div className="flex gap-3 no-print">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">print</span> Print Prescription
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">history</span> View History
          </button>
        </div>
      </div>

      {patient && (
        <div onClick={() => setShowProfile(true)} className="cursor-pointer">
          <PatientInfoCard 
            patient={patient} 
            doctorName={prescription.doctorName} 
            prescriptionDate={prescription.createdAt} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MedicineTable items={prescription.items} />
        </div>

        <aside className="space-y-6 no-print">
          <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Dispense Summary</h3>
            <div className="space-y-3 mb-6 border-b border-[var(--border)] pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Items</span>
                <span className="text-[var(--text-primary)] font-medium">{prescription.items.length}</span>
              </div>
            </div>
            
            <button 
              onClick={handleDispense}
              className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">medication_liquid</span>
              Proceed to Billing
            </button>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-600">info</span>
              <div>
                <p className="text-sm font-bold text-orange-900">Pharmacist Note</p>
                <p className="text-xs text-orange-800 mt-1">Please ensure patient identity and allergy history before dispensing high-alert medications.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showProfile && patient && (
        <PatientProfileModal 
          patient={patient} 
          onClose={() => setShowProfile(false)} 
        />
      )}

      {showHistory && patient && (
        <PatientHistoryModal 
          patientId={patient.id} 
          onClose={() => setShowHistory(false)} 
        />
      )}
    </div>
  );
};

export default PrescriptionDetailsPage;
