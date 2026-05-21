'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionBilling } from '@/modules/reception/hooks/useReceptionBilling';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { formatToken } from '@/utils/tokenHelper';
import { getPrimarySpecialization } from '@/utils/staffDisplay';

export const BillingPage = () => {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);

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
    invoice,
    isPaid
  } = useReceptionBilling();

  const onConfirmPayment = async () => {
    const result = await handleMarkAsPaid();
    if (result) {
      setBookedAppointmentId(result.id);
      setShowSuccessModal(true);
    }
  };

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

  const isVitalsEnabled = appointment.status === 'PAID' || appointment.status === 'VITALS_RECORDED' || appointment.status === 'SCHEDULED';
  const isReadOnly = ['CONSULTATION_STARTED', 'PRESCRIPTION_FINALIZED', 'COMPLETED'].includes(appointment.status);

  return (
    <MainLayout title="Consultation Billing" hideTitle>
      <div className="invoice-print-container op-bill-print-page mx-auto w-full max-w-[1600px] bg-[#f7f9fc] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 font-inter pb-44 sm:pb-36">
        
        <div className="op-bill-screen-heading no-print">
          <PageHeading 
            title="Consultation Billing" 
            description={isReadOnly ? "View finalized consultation billing and transaction details." : "Finalize patient visit fees and process medical service payments."}
            className="mb-5 sm:mb-6 lg:mb-8"
          >
             <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
               <Badge variant={isPaid ? 'emerald' : 'orange'} className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs shadow-sm">
                 Status: {isPaid ? (isReadOnly ? appointment.status.replace('_', ' ') : 'PAID') : 'PAYMENT PENDING'}
               </Badge>
               <Badge variant="slate" className="px-3 py-1.5 sm:px-4 sm:py-2 border-slate-200 text-[10px] sm:text-xs shadow-sm">
                 {invoice ? `Invoice: ${invoice.invoiceNumber}` : `ID: #INV-${appointment.id.substring(0, 8).toUpperCase()}`}
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

        <div className="op-bill-print-grid grid w-full grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[350px_1fr]">
          
          {/* Patient Profile Card */}
          <div className="op-bill-left-column flex min-w-0 flex-col gap-5 sm:gap-6">
            <Card className="op-bill-card w-full overflow-hidden border-slate-100 shadow-md">
              <div className="flex flex-col items-center p-2 text-center sm:p-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-2xl sm:text-3xl uppercase mb-4 border-4 border-white shadow-sm">
                  {patient.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">{patient.fullName}</h3>
                <p className="text-[9px] sm:text-[10px] font-black text-orange-600 uppercase tracking-widest mb-6">Patient Record #{patient.patientCode || 'N/A'}</p>
                
                <div className="w-full space-y-3 border-t border-slate-100 pt-5 sm:space-y-4 sm:pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Age / Gender</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / {patient.gender}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Phone Number</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{patient.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Visit Category</span>
                    <Badge variant="blue" size="sm">Out-Patient</Badge>
                  </div>
                </div>
              </div>
            </Card>

            {!isReadOnly && (
              <div className="op-bill-policy relative w-full overflow-hidden rounded-2xl bg-orange-600 p-4 text-white shadow-lg shadow-orange-600/20 sm:p-6">
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-6xl sm:text-8xl opacity-10 rotate-12">info</span>
                <h4 className="font-bold text-xs sm:text-sm mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base sm:text-lg">policy</span>
                  Billing Policy
                </h4>
                <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed opacity-90">
                  All consultation fees are non-refundable once processed. Please verify the consulting doctor and visit type before confirming the transaction.
                </p>
              </div>
            )}
          </div>

          {/* Billing Details */}
          <div className="op-bill-right-column flex min-w-0 flex-col gap-5 sm:gap-6">
            
            {/* Service Information */}
            <Card title="Medical Service Details" icon="medical_services" className="op-bill-card w-full border-slate-100 shadow-sm">
              <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
                <div className="lg:col-span-2">
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consulting Physician</p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="material-symbols-outlined text-orange-600 text-base sm:text-xl shrink-0">person_search</span>
                      <p className="font-bold text-slate-900 text-sm sm:text-base truncate">Dr. {appointment.doctorName}</p>
                    </div>
                    <Badge variant="slate" className="shrink-0 text-[8px] sm:text-[10px]">{getPrimarySpecialization(doctor)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">OP Token No.</p>
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-[72px] sm:h-auto">
                    <p className="font-black text-slate-900 text-base sm:text-xl leading-none">
                      {formatToken(appointment) === '---' ? (predictedToken || 'PENDING') : formatToken(appointment)}
                    </p>
                    {!isPaid && !appointment.tokenDisplay && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-orange-600 uppercase mt-1">Expected Token</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Date</p>
                  <p className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-900 text-sm sm:text-base h-[72px] sm:h-auto flex items-center">
                    {new Date(appointment.appointmentTime).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cost Breakdown */}
            <Card title="Financial Breakdown" icon="payments" className="op-bill-card w-full border-slate-100 shadow-sm">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm font-bold text-slate-600">Base Fee</span>
                  <span className="font-black text-slate-900">₹{(invoice?.subtotalAmount ?? consultationFee).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-1 sm:py-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-600">Discount</span>
                  {appointment.status === 'PAYMENT_PENDING' ? (
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">₹</span>
                      <input 
                        type="number"
                        className="w-24 sm:w-32 pl-6 sm:pl-7 pr-2 sm:pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-slate-900 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                      />
                    </div>
                  ) : (
                    <span className="font-black text-emerald-600">- ₹{(invoice?.discountAmount ?? discount).toFixed(2)}</span>
                  )}
                </div>
                {isPaid && (
                   <div className="flex items-center justify-between gap-4 border-t border-slate-100 py-1 pt-3">
                     <span className="text-xs sm:text-sm font-bold text-slate-500">Amount Paid</span>
                     <span className="font-black text-emerald-700">₹{(invoice?.amountPaid ?? total).toFixed(2)}</span>
                   </div>
                )}
                <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:mt-6 sm:flex-row sm:items-end sm:pt-6">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {isPaid ? 'Balance Due' : 'Total Net Payable'}
                    </p>
                    <p className="text-[10px] sm:text-sm font-bold text-slate-500 italic">Inclusive of all medical charges</p>
                  </div>
                  <span className={`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${isPaid && (invoice?.amountDue ?? 0) <= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    ₹{(isPaid ? (invoice?.amountDue ?? 0) : total).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            {!isPaid && (
              <Card title="Select Payment Method" icon="account_balance_wallet" className="op-bill-payment-method no-print w-full border-slate-100 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {[
                    { id: 'CASH', label: 'Cash', icon: 'payments' },
                    { id: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
                    { id: 'CARD', label: 'Card', icon: 'credit_card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`group flex min-h-[104px] flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all sm:p-6 ${
                        paymentMethod === m.id
                          ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-lg shadow-orange-600/10'
                          : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-2xl sm:text-3xl mb-2 transition-transform ${paymentMethod === m.id ? 'scale-110' : 'group-hover:scale-110'}`}>
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
      <div className="op-bill-action-bar no-print fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-slate-200 bg-white/90 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="flex w-full max-w-[1600px] flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Amount Due</span>
            <span className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">₹{total.toFixed(2)}</span>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            {appointment.status === 'PAYMENT_PENDING' ? (
              <Button 
                size="xl" 
                icon="check_circle" 
                fullWidth 
                className="px-6 text-sm font-black uppercase sm:w-auto sm:px-12"
                isLoading={submittingPayment}
                onClick={onConfirmPayment}
              >
                {submittingPayment ? 'Processing...' : 'Confirm Payment'}
              </Button>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  icon="receipt_long" 
                  onClick={generateBill}
                  className="w-full text-[10px] font-black uppercase sm:w-auto sm:flex-none"
                >
                  Download Invoice
                </Button>
                {isVitalsEnabled && !isReadOnly && (
                  <Button 
                    size="lg" 
                    icon="vital_signs" 
                    onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${appointment.id}`)}
                    className="w-full text-[10px] font-black uppercase sm:w-auto sm:flex-none"
                  >
                    {appointment.status === 'VITALS_RECORDED' ? 'Edit Vitals' : 'Proceed to Vitals'}
                  </Button>
                )}
                {isReadOnly && (
                   <Button 
                    variant="secondary"
                    size="lg" 
                    icon="close" 
                    onClick={() => router.push('/reception/appointments')}
                    className="w-full text-[10px] font-black uppercase sm:w-auto sm:flex-none"
                  >
                    Close
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)}
        title="Payment Confirmed"
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Transaction Successful!</h3>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            The consultation for <span className="text-slate-900 font-bold">{patient.fullName}</span> has been confirmed. You can now proceed to record vitals or book another appointment.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              fullWidth 
              icon="vital_signs"
              onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${bookedAppointmentId || appointment.id}`)}
              className="text-xs font-black uppercase tracking-widest"
            >
              Proceed to Vitals
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              fullWidth 
              icon="person_add"
              onClick={() => router.push('/reception/appointments/create')}
              className="text-xs font-black uppercase tracking-widest"
            >
              Book Next Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
