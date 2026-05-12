'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionBilling } from '@/modules/reception/hooks/useReceptionBilling';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatToken } from '@/utils/tokenHelper';

export const BillingPage = () => {
  const router = useRouter();
  const {
    appointment,
    patient,
    doctor,
    loading,
    predictedToken,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,
    submittingPayment,
    consultationFee,
    total,
    handleMarkAsPaid,
    generateBill,
    isPaid
  } = useReceptionBilling();

  if (loading) {
    return (
      <MainLayout title="Processing Billing...">
        <div className="p-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving billing records...</p>
        </div>
      </MainLayout>
    );
  }

  if (!appointment || !patient) {
    return (
      <MainLayout title="Error">
        <div className="p-20 text-center">
          <Badge variant="red" size="md" className="mb-4">Resource Not Found</Badge>
          <p className="text-slate-900 font-black text-xl mb-6">Unable to locate appointment or patient record.</p>
          <Button icon="arrow_back" onClick={() => router.back()}>Return to Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Consultation Billing" hideTitle>
      <div className="op-bill-print-page p-8 max-w-[1200px] mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen font-inter pb-32">
        
        <div className="op-bill-screen-heading">
          <PageHeading 
            title="Consultation Billing" 
            description="Finalize patient visit fees and process medical service payments."
          >
            <div className="flex items-center gap-3">
               <Badge variant={isPaid ? 'emerald' : 'orange'} className="px-4 py-2">
                 Status: {appointment.status.replace('_', ' ')}
               </Badge>
               <Badge variant="slate" className="px-4 py-2 border-slate-200">
                 ID: #INV-{appointment.id.substring(0, 8).toUpperCase()}
               </Badge>
            </div>
          </PageHeading>
        </div>

        <div className="op-bill-print-header hidden">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">OP Consultation Bill</p>
            <h1 className="text-2xl font-black text-slate-950">Consultation Invoice</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice ID</p>
            <p className="text-sm font-black text-slate-900">#INV-{appointment.id.substring(0, 8).toUpperCase()}</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">Status: {isPaid ? 'PAID' : 'PENDING'}</p>
          </div>
        </div>

        <div className="op-bill-print-grid grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Patient Profile Card */}
          <div className="op-bill-left-column lg:col-span-4 space-y-6">
            <Card className="op-bill-card border-none shadow-md">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-3xl uppercase mb-4 border-4 border-white shadow-sm">
                  {patient.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{patient.fullName}</h3>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-6">Patient Record #{patient.patientCode || 'N/A'}</p>
                
                <div className="w-full space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Age / Gender</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / {patient.gender}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Phone Number</span>
                    <span className="font-bold text-slate-900 text-sm">{patient.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Visit Category</span>
                    <Badge variant="blue" size="sm">Out-Patient</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div className="op-bill-policy bg-orange-600 p-6 rounded-2xl text-white shadow-lg shadow-orange-600/20 relative overflow-hidden">
               <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 rotate-12">info</span>
               <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">policy</span>
                 Billing Policy
               </h4>
               <p className="text-[11px] font-medium leading-relaxed opacity-90">
                 All consultation fees are non-refundable once processed. Please verify the consulting doctor and visit type before confirming the transaction.
               </p>
            </div>
          </div>

          {/* Billing Details */}
          <div className="op-bill-right-column lg:col-span-8 space-y-6">
            
            {/* Service Information */}
            <Card title="Medical Service Details" icon="medical_services" className="op-bill-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consulting Physician</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-orange-600">person_search</span>
                      <p className="font-bold text-slate-900">Dr. {appointment.doctorName}</p>
                    </div>
                    <Badge variant="slate">{doctor?.specialization || 'General Practice'}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">OP Token No.</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <p className="font-black text-slate-900 leading-none">
                      {formatToken(appointment) !== '---' ? formatToken(appointment) : (predictedToken || 'PENDING')}
                    </p>
                    {!isPaid && !appointment.tokenDisplay && (
                      <span className="text-[9px] font-bold text-orange-600 uppercase mt-1">Expected Token</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Date</p>
                  <p className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-900">
                    {new Date(appointment.appointmentTime).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cost Breakdown */}
            <Card title="Financial Breakdown" icon="payments" className="op-bill-card">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Base Consultation Fee</span>
                  <span className="font-black text-slate-900">₹{consultationFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-600">Applied Discount</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                    <input 
                      type="number"
                      className="w-32 pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-slate-900 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      disabled={isPaid}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">Applicable Taxes (0%)</span>
                  <span className="font-black text-slate-900">₹0.00</span>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Net Payable</p>
                    <p className="text-sm font-bold text-slate-500 italic">Inclusive of all medical charges</p>
                  </div>
                  <span className="text-4xl font-black text-orange-600 tracking-tighter">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            {!isPaid && (
              <Card title="Select Payment Method" icon="account_balance_wallet" className="op-bill-payment-method">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'CASH', label: 'Cash', icon: 'payments' },
                    { id: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
                    { id: 'CARD', label: 'Credit Card', icon: 'credit_card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group ${
                        paymentMethod === m.id
                          ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-lg shadow-orange-600/10'
                          : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-3xl mb-3 transition-transform ${paymentMethod === m.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {m.icon}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="op-bill-action-bar fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 z-50 flex justify-center">
        <div className="max-w-[1200px] w-full flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Amount Due</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">₹{total.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-4">
            {isPaid ? (
              <>
                <Button 
                  variant="secondary" 
                  size="xl" 
                  icon="receipt_long" 
                  onClick={generateBill}
                >
                  Download Invoice
                </Button>
                <Button 
                  size="xl" 
                  icon="vital_signs" 
                  onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${appointment.id}`)}
                >
                  Proceed to Vitals
                </Button>
              </>
            ) : (
              <Button 
                size="xl" 
                icon="check_circle" 
                fullWidth 
                className="px-12"
                isLoading={submittingPayment}
                onClick={handleMarkAsPaid}
              >
                {submittingPayment ? 'Processing Transaction...' : 'Confirm Payment'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
