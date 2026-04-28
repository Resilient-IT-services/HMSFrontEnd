'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { AppointmentResponse, PatientResponse, DoctorStaffResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

const BillingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [doctor, setDoctor] = useState<DoctorStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [discount, setDiscount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    try {
      const appRes = await appointmentService.get(appointmentId);
      if (appRes.success && appRes.data) {
        setAppointment(appRes.data);
        
        const [patRes, docRes] = await Promise.all([
          patientService.get(appRes.data.patientId),
          doctorService.list(0, 100)
        ]);

        if (patRes.success) setPatient(patRes.data || null);
        if (docRes.success && docRes.data) {
          const doc = docRes.data.content.find(d => d.doctorId === appRes.data.doctorId);
          if (doc) setDoctor(doc);
        }
      }
    } catch (error) {
      console.error('Failed to fetch billing data', error);
      triggerGlobalToast('Failed to load billing details', 'error');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consultationFee = doctor?.consultationFee || 0;
  const tax = 0;
  const total = Math.max(0, consultationFee - discount + tax);

  const handleGenerateBill = () => {
    triggerGlobalToast('Bill generated successfully', 'success');
    // In a real app, this would call a service to save the bill
    window.print();
  };

  const handleDownloadReceipt = () => {
    triggerGlobalToast('Receipt download started', 'success');
    // Mock download
    const element = document.createElement('a');
    const file = new Blob(['Mock Bill Content'], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `bill_${appointmentId}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  if (loading) {
    return <MainLayout title="Loading..."><div className="p-8 text-center">Loading billing details...</div></MainLayout>;
  }

  if (!appointment || !patient) {
    return <MainLayout title="Error"><div className="p-8 text-center text-red-600 font-bold">Appointment not found.</div></MainLayout>;
  }

  return (
    <MainLayout title="OP Consultation Billing" hideTitle>
      <div className="h-screen flex flex-col bg-[#f9f9ff] font-inter overflow-hidden">
        {/* Header */}
        <header className="px-8 py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-50 rounded-full border border-slate-200">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">OP Consultation Billing</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-bold text-xs border border-orange-100">
               Bill ID: #INV-{appointmentId?.substring(0, 8).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left: Patient & Summary */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-2xl uppercase">
                    {patient.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{patient.fullName}</h3>
                    <p className="text-xs text-slate-500 font-medium">ID: #PAT-{patient.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Age / Gender</span>
                    <span className="font-bold text-slate-900">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / {patient.gender}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Visit Type</span>
                    <span className="font-bold text-slate-900">Out-Patient</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-bold text-slate-900">{patient.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex gap-4">
                <span className="material-symbols-outlined text-orange-600">info</span>
                <p className="text-xs text-orange-800 font-medium leading-relaxed">
                  Fees are based on standard hospital rates for general consultation. Discounts apply only to valid promo codes or follow-ups.
                </p>
              </div>
            </div>

            {/* Right: Billing Form */}
            <div className="md:col-span-8 space-y-6">
              {/* Service Details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest text-slate-400">Service Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Consulting Doctor</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 flex items-center gap-3">
                       <span className="material-symbols-outlined text-orange-600">medical_services</span>
                       {appointment.doctorName} ({doctor?.specialization || 'General'})
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">OP Token No.</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                       {appointment.tokenDisplay || `A-${appointment.id.substring(0, 3).toUpperCase()}`}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Visit Date</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                       {new Date(appointment.appointmentTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest text-slate-400">Cost Breakdown</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-600 font-medium">Consultation Fee</span>
                     <span className="font-bold text-slate-900">₹{consultationFee.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-slate-600 font-medium">Discount</span>
                     <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                        <input 
                          type="number"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-slate-900 focus:ring-2 focus:ring-orange-200 outline-none"
                          value={discount}
                          onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-slate-600 font-medium">Tax (0%)</span>
                     <span className="font-bold text-slate-900">₹{tax.toFixed(2)}</span>
                   </div>
                   <div className="pt-6 border-t border-slate-100 mt-4 flex justify-between items-center">
                     <span className="text-xl font-black text-slate-900">Total Payable Amount</span>
                     <span className="text-3xl font-black text-orange-600">₹{total.toFixed(2)}</span>
                   </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest text-slate-400">Payment Method</h4>
                <div className="grid grid-cols-3 gap-4">
                   {[
                     { id: 'CASH', label: 'Cash', icon: 'payments' },
                     { id: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
                     { id: 'CARD', label: 'Card', icon: 'credit_card' },
                   ].map((m) => (
                     <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === m.id 
                            ? 'border-orange-600 bg-orange-50 text-orange-600' 
                            : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                        }`}
                     >
                       <span className="material-symbols-outlined text-3xl mb-2">{m.icon}</span>
                       <span className="text-xs font-black uppercase tracking-widest">{m.label}</span>
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 flex justify-between items-center z-50">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable</span>
              <span className="text-2xl font-black text-slate-900">₹{total.toFixed(2)}</span>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadReceipt}
                className="px-6 py-3 text-slate-600 font-bold hover:text-slate-900 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">download</span>
                Download Receipt
              </button>
              <button 
                onClick={handleGenerateBill}
                className="px-10 py-3 bg-orange-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                Generate Bill & Print
              </button>
           </div>
        </footer>
      </div>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav, aside, header, footer, button, .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
          .max-w-5xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default BillingPage;
