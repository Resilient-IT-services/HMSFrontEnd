'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { QuickPharmacySaleResponse } from '@/types/api';
import MainLayout from '@/components/ui/MainLayout';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';

interface PharmacySaleDetailPageProps {
  id?: string;
  prescriptionId?: string;
}

const formatCurrency = (amount?: number) => {
  return `Rs ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PharmacySaleDetailPage: React.FC<PharmacySaleDetailPageProps> = ({ id, prescriptionId }) => {
  const router = useRouter();
  const [sale, setSale] = useState<QuickPharmacySaleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        let response;
        if (id) {
          response = await pharmacyApi.getSale(id);
        } else if (prescriptionId) {
          response = await pharmacyApi.getSaleByPrescription(prescriptionId);
        }
        
        if (response?.success && response.data) {
          setSale(response.data);
        } else {
          triggerGlobalToast(response?.message || 'Failed to fetch dispensing record', 'error');
        }
      } catch (error) {
        console.error(error);
        triggerGlobalToast('An error occurred while loading records', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSale();
  }, [id, prescriptionId]);

  const handlePrint = () => {
    globalThis.print();
  };

  if (loading) return <MainLayout title="Sale Details" hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><LoadingSkeleton /></PageSurface></MainLayout>;
  if (!sale) return <MainLayout title="Sale Details" hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><div className="p-8 text-center font-bold text-slate-400 uppercase tracking-widest">Sale not found</div></PageSurface></MainLayout>;

  const totalDiscount = sale.items.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
  const subtotal = sale.totalAmount + totalDiscount;

  return (
    <MainLayout title={`Sale #${sale.saleNumber}`} hideTitle>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="space-y-8 py-4 md:py-8">
          <PageHeading
            title="Dispensing Transaction"
            description={`Viewing record for invoice ${sale.invoiceNumber}.`}
            className="no-print"
          />
          <div className="max-w-5xl mx-auto w-full space-y-6 pb-20">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center no-print">
              <button 
                onClick={() => router.push('/pharmacy/sales')}
                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Back to Billing
              </button>
              
              <div className="flex gap-3">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Print Bill
                  </button>
              </div>
            </div>

            {/* Picking List Alert - High Visibility for Pharmacy Staff */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-8 shadow-sm no-print animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <span className="material-symbols-outlined text-3xl font-black">inventory_2</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-orange-900 uppercase tracking-tight">Physical Picking List</h2>
                    <p className="text-orange-700/70 text-sm font-bold uppercase tracking-widest mt-0.5">Please dispense following batches in specified quantities</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sale.items.map((item) => (
                    <div key={item.id} className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                      <div>
                          <p className="text-sm font-black text-slate-800 leading-tight mb-1">{item.medicineName}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-orange-700 text-white text-[10px] font-black rounded-md uppercase font-mono">
                              BATCH: {item.batchNumber}
                            </span>
                          </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-orange-50 flex justify-between items-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty to Pick</span>
                          <span className="text-3xl font-black text-orange-700 leading-none">{item.quantity}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Invoice Layout (Printable) */}
            <div id="printable-invoice" className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
              {/* Invoice Header */}
              <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-start print:bg-transparent">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                          <span className="material-symbols-outlined font-black">health_metrics</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900 uppercase tracking-tighter">HMS PHARMACY</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-1">INVOICE</h1>
                    <p className="text-sm font-black text-primary uppercase tracking-[0.2em]">{sale.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className="mb-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
                        <p className="text-sm font-bold text-slate-800">{new Date(sale.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                          {sale.status}
                        </span>
                    </div>
                  </div>
              </div>

              {/* Customer & Doctor Details */}
              <div className="p-10 grid grid-cols-2 gap-10 border-b border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill To (Customer)</p>
                    <h3 className="text-lg font-black text-slate-800 uppercase">{sale.customerName || 'Walk-in Customer'}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">{sale.customerPhone || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prescribed By</p>
                    <h3 className="text-lg font-black text-slate-800 uppercase">{sale.externalDoctorName || 'Hospital Doctor'}</h3>
                  </div>
              </div>

              {/* Item Table */}
              <div className="p-10">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <th className="pb-4 px-4">Item Description</th>
                          <th className="pb-4 px-4 text-center">Batch</th>
                          <th className="pb-4 px-4 text-center">Qty</th>
                          <th className="pb-4 px-4 text-right">Rate</th>
                          <th className="pb-4 px-4 text-right">Disc.</th>
                          <th className="pb-4 px-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item) => (
                          <tr key={item.id} className="bg-slate-50/50 print:bg-transparent">
                              <td className="py-4 px-4 rounded-l-2xl border-l border-t border-b border-slate-100 print:border-none">
                                <p className="font-black text-sm text-slate-800">{item.medicineName}</p>
                              </td>
                              <td className="py-4 px-4 text-center border-t border-b border-slate-100 font-mono text-[11px] font-bold text-slate-600 print:border-none">
                                #{item.batchNumber}
                              </td>
                              <td className="py-4 px-4 text-center border-t border-b border-slate-100 font-black text-sm text-slate-800 print:border-none">
                                {item.quantity}
                              </td>
                              <td className="py-4 px-4 text-right border-t border-b border-slate-100 font-bold text-sm text-slate-500 print:border-none">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-4 px-4 text-right border-t border-b border-slate-100 font-bold text-sm text-emerald-600 print:border-none">
                                -{formatCurrency(item.discountAmount)}
                              </td>
                              <td className="py-4 px-4 text-right rounded-r-2xl border-r border-t border-b border-slate-100 font-black text-sm text-primary print:border-none">
                                {formatCurrency(item.netAmount)}
                              </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
              </div>

              {/* Totals */}
              <div className="p-10 bg-slate-50 flex justify-end print:bg-transparent">
                  <div className="w-80 space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                        <span className="text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Total Discount</span>
                        <span className="text-emerald-600">-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="pt-6 border-t-2 border-dashed border-slate-200 flex justify-between items-end">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Grand Total</span>
                        <span className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
              </div>

              {/* Footer */}
              <div className="p-10 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Thank you for your visit</p>
                  <p className="text-[9px] font-bold text-slate-300 mt-2">Computer generated invoice. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      </PageSurface>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
          #printable-invoice {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default PharmacySaleDetailPage;
