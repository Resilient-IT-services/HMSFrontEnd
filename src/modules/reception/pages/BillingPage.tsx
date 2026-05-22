'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { useReceptionBilling } from '@/modules/reception/hooks/useReceptionBilling';
import { PageHeading } from '@/components/ui/PageHeading';
import { PageSurface } from '@/components/ui/PageSurface';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Retrieving billing records...</p>
          </div>
        </MainLayout>
    );
  }

  if (!appointment || !patient) {
    return (
        <MainLayout title="Error">
          <div className="p-12 text-center">
            <Badge variant="red" size="md" className="mb-3">Resource Not Found</Badge>
            <p className="text-slate-900 font-black text-lg mb-4">Unable to locate appointment or patient record.</p>
            <Button icon="arrow_back" onClick={() => router.back()}>Return to Dashboard</Button>
          </div>
        </MainLayout>
    );
  }

  const isVitalsEnabled = appointment.status === 'PAID' || appointment.status === 'VITALS_RECORDED' || appointment.status === 'SCHEDULED';
  const isReadOnly = ['CONSULTATION_STARTED', 'PRESCRIPTION_FINALIZED', 'COMPLETED'].includes(appointment.status);

  return (
    <MainLayout title="Consultation Billing" hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          {/* Top Header */}
          <div className="no-print mb-4">
            <PageHeading
                title="Consultation Billing"
                description={isReadOnly ? "View finalized consultation billing and transaction details." : "Finalize patient visit fees and process medical service payments."}
                className="mb-0"
            >
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-2">
                <Badge variant={isPaid ? 'emerald' : 'orange'} className="px-3 py-1 text-[10px] sm:text-xs shadow-sm font-bold">
                  Status: {isPaid ? (isReadOnly ? appointment.status.replace('_', ' ') : 'PAID') : 'PAYMENT PENDING'}
                </Badge>
                <Badge variant="slate" className="px-3 py-1 border-slate-200 text-[10px] sm:text-xs shadow-sm font-bold">
                  {invoice ? `Invoice: ${invoice.invoiceNumber}` : `ID: #INV-${appointment.id.substring(0, 8).toUpperCase()}`}
                </Badge>
              </div>
            </PageHeading>
          </div>

          {/* Print Header */}
          <div className="hidden justify-between items-center border-b pb-4 mb-4 op-bill-print-header">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">OP Consultation Bill</p>
              <h1 className="text-xl font-black text-slate-950">Consultation Invoice</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice ID</p>
              <p className="text-sm font-black text-slate-900">#INV-{appointment.id.substring(0, 8).toUpperCase()}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">Status: {isPaid ? 'PAID' : 'PENDING'}</p>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">

            {/* LEFT COLUMN: Patient Info & Medical Details */}
            <div className="flex flex-col gap-4">

              {/* Patient Profile Card */}
              <Card className="w-full border-slate-100 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Patient Record #{patient.patientCode || 'N/A'}</p>
                  <h3 className="text-lg font-black text-slate-900 mb-4">{patient.fullName}</h3>

                  <div className="w-full space-y-2.5 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Age / Gender</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}Y / {patient.gender}
                    </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Phone Number</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{patient.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Visit Category</span>
                      <Badge variant="blue" size="sm" className="px-2 py-0.5 text-[10px]">Out-Patient</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Medical Service Details */}
              <Card title="Medical Service Details" icon="medical_services" className="w-full border-slate-100 shadow-sm">
                <div className="space-y-3.5">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Consulting Physician</p>
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-orange-600 text-lg shrink-0">person_search</span>
                        <p className="font-bold text-slate-900 text-sm truncate">Dr. {appointment.doctorName}</p>
                      </div>
                      <Badge variant="slate" className="shrink-0 text-[9px] px-2 py-0.5">{getPrimarySpecialization(doctor)}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">OP Token No.</p>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center min-h-[52px]">
                        <p className="font-black text-slate-900 text-base leading-none">
                          {formatToken(appointment) === '---' ? (predictedToken || 'PENDING') : formatToken(appointment)}
                        </p>
                        {!isPaid && !appointment.tokenDisplay && (
                            <span className="text-[8px] font-bold text-orange-600 uppercase mt-0.5">Expected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Visit Date</p>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-900 text-xs min-h-[52px] flex items-center">
                        {new Date(appointment.appointmentTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Financial Breakdown & Payment Selection */}
            <div className="flex flex-col gap-4">

              {/* Cost Breakdown */}
              <Card title="Financial Breakdown" icon="payments" className="border-slate-100 shadow-sm">
                <div className="space-y-3">

                  {/* Base Fee */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-600">Base Fee</span>
                    <span className="font-black text-slate-900 text-sm">
                    ₹{(invoice?.subtotalAmount ?? consultationFee).toFixed(2)}
                  </span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center py-0.5 border-t border-slate-50 pt-2">
                    <span className="text-xs font-bold text-slate-600">Discount</span>

                    {appointment.status === 'PAYMENT_PENDING' ? (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">₹</span>
                          <input
                              type="number"
                              min="0"
                              max={invoice?.subtotalAmount ?? consultationFee}
                              className="w-24 sm:w-28 pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-black text-slate-900 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-xs"
                              value={discount}
                              onChange={(e) => {
                                let value = Number(e.target.value);
                                if (Number.isNaN(value) || value < 0) value = 0;
                                const base = invoice?.subtotalAmount ?? consultationFee;
                                if (value > base) value = base;
                                setDiscount(value);
                              }}
                          />
                        </div>
                    ) : (
                        <span className="font-black text-emerald-600 text-sm">
                        - ₹{Math.max(0, (invoice?.discountAmount ?? discount)).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Amount Paid */}
                  {isPaid && (
                      <div className="flex justify-between items-center py-0.5 border-t border-slate-50 pt-2">
                        <span className="text-xs font-bold text-slate-500">Amount Paid</span>
                        <span className="font-black text-emerald-700 text-sm">
                        ₹{(invoice?.amountPaid ?? total).toFixed(2)}
                      </span>
                      </div>
                  )}

                  {/* Total Net Payable */}
                  <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        {isPaid ? 'Balance Due' : 'Total Net Payable'}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 italic">
                        Inclusive of all medical taxes
                      </p>
                    </div>
                    <span className={`text-2xl font-black tracking-tighter leading-none ${
                        isPaid && (invoice?.amountDue ?? 0) <= 0 ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                    ₹{(isPaid ? (invoice?.amountDue ?? 0) : total).toFixed(2)}
                  </span>
                  </div>

                </div>
              </Card>

              {/* Payment Method Selector & Integrated Billing Policy */}
              {!isPaid && (
                  <Card title="Select Payment Method" icon="account_balance_wallet" className="no-print border-slate-100 shadow-sm">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'CASH', label: 'Cash', icon: 'payments' },
                          { id: 'UPI', label: 'UPI / QR', icon: 'qr_code_2' },
                          { id: 'CARD', label: 'Card', icon: 'credit_card' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setPaymentMethod(m.id as any)}
                                className={`group flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all min-h-[84px] ${
                                    paymentMethod === m.id
                                        ? 'border-orange-600 bg-orange-50/60 text-orange-600 shadow-sm'
                                        : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                                }`}
                            >
                        <span className={`material-symbols-outlined text-xl mb-1.5 transition-transform ${paymentMethod === m.id ? 'scale-105' : 'group-hover:scale-105'}`}>
                          {m.icon}
                        </span>
                              <span className="text-[9px] font-black uppercase tracking-wider">{m.label}</span>
                            </button>
                        ))}
                      </div>

                      {/* Billing Policy Note (Shifted here to streamline layout) */}
                      {!isReadOnly && (
                          <div className="flex gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3 items-start">
                            <span className="material-symbols-outlined text-orange-600 text-sm mt-0.5 shrink-0">policy</span>
                            <p className="text-[10px] font-medium leading-normal text-slate-500">
                              <strong className="text-slate-700">Billing Policy:</strong> Fees are non-refundable once processed. Please verify practitioner and transaction variables before confirmation.
                            </p>
                          </div>
                      )}
                    </div>
                  </Card>
              )}

            </div>
          </div>
        </div>
      </PageSurface>

        {/* Sticky Bottom Action Bar */}
        <div className="no-print fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-slate-200 bg-white/95 p-3.5 shadow-[0_-10px_25px_rgba(15,23,42,0.05)] backdrop-blur-md sm:px-6">
          <div className="flex w-full max-w-[1600px] flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start border-b sm:border-0 pb-2 sm:pb-0 border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest sm:mb-0.5">Amount Due</span>
              <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">₹{total.toFixed(2)}</span>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              {appointment.status === 'PAYMENT_PENDING' ? (
                  <Button
                      size="lg"
                      icon="check_circle"
                      fullWidth
                      className="px-8 text-xs font-black uppercase tracking-wider sm:w-auto"
                      isLoading={submittingPayment}
                      onClick={onConfirmPayment}
                  >
                    {submittingPayment ? 'Processing...' : 'Confirm Payment'}
                  </Button>
              ) : (
                  <>
                    <Button
                        variant="secondary"
                        size="md"
                        icon="receipt_long"
                        onClick={generateBill}
                        className="w-full text-[10px] font-black uppercase sm:w-auto"
                    >
                      Download Invoice
                    </Button>
                    {isVitalsEnabled && !isReadOnly && (
                        <Button
                            size="md"
                            icon="vital_signs"
                            onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${appointment.id}`)}
                            className="w-full text-[10px] font-black uppercase sm:w-auto"
                        >
                          {appointment.status === 'VITALS_RECORDED' ? 'Edit Vitals' : 'Proceed to Vitals'}
                        </Button>
                    )}
                    {isReadOnly && (
                        <Button
                            variant="secondary"
                            size="md"
                            icon="close"
                            onClick={() => router.push('/reception/appointments')}
                            className="w-full text-[10px] font-black uppercase sm:w-auto"
                        >
                          Close
                        </Button>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            title="Payment Confirmed"
        >
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1.5">Transaction Successful!</h3>
            <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
              The consultation for <span className="text-slate-900 font-bold">{patient.fullName}</span> has been confirmed. Proceed to record vitals or book another appointment.
            </p>

            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button
                  size="md"
                  fullWidth
                  icon="vital_signs"
                  onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${bookedAppointmentId || appointment.id}`)}
                  className="text-[10px] font-black uppercase tracking-wider"
              >
                Proceed to Vitals
              </Button>
              <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  icon="person_add"
                  onClick={() => router.push('/reception/appointments/create')}
                  className="text-[10px] font-black uppercase tracking-wider"
              >
                Book Next Appointment
              </Button>
            </div>
          </div>
        </Modal>
      </MainLayout>
  );
};