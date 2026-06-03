'use client';

import React, { useEffect, useState } from 'react';
import { pharmacyApi } from '../api/pharmacyApi';
import { QuickPharmacySaleResponse } from '@/types/api';
import MainLayout from '@/components/ui/MainLayout';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { invoiceService } from '@/services/invoiceService';

interface PharmacySaleDetailPageProps {
    id?: string;
    prescriptionId?: string;
}

const formatCurrency = (amount?: number) => {
    return `Rs ${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PharmacySaleDetailPage: React.FC<PharmacySaleDetailPageProps> = ({ id, prescriptionId }) => {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
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

    const handleDownloadInvoice = async () => {
        if (!sale?.invoiceId) return;
        try {
            triggerGlobalToast('Generating secure invoice...', 'info');
            const blob = await invoiceService.exportPdf(sale.invoiceId, 'PHARMACY');
            const url = globalThis.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `pharmacy_invoice_${sale.invoiceNumber}.pdf`);
            document.body.append(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Invoice Generation Error:', error);
            triggerGlobalToast('Failed to generate secure invoice', 'error');
        }
    };

    if (loading) return <MainLayout title="Sale Details" hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><LoadingSkeleton /></PageSurface></MainLayout>;
    if (!sale) return <MainLayout title="Sale Details" hideTitle><PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter"><div className="p-8 text-center font-bold text-slate-400 uppercase tracking-widest">Sale not found</div></PageSurface></MainLayout>;

    const totalDiscount = (() => {
        let total = 0;
        for (const item of sale.items) {
            total += (item.discountAmount || 0);
        }
        return total;
    })();

    const subtotal = sale.totalAmount + totalDiscount;

    const loggedInHospitalName = user?.memberships.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName;
    const dynamicHospitalName = loggedInHospitalName || 'CAREFLOW HOSPITAL & MEDICAL RESEARCH';

    return (
        <MainLayout title={`Sale #${sale.saleNumber}`} hideTitle>
            <PageSurface
                maxWidthClassName="max-w-[1600px]"
                backgroundClassName="bg-[#f8f9fb]"
                fontClassName="font-inter"
            >
                <div className="space-y-6 py-4 md:py-6">
                    <PageHeading
                        title="Dispensing Transaction"
                        description={`Viewing record for invoice ${sale.invoiceNumber}.`}
                        className="no-print"
                    />

                    <div className="max-w-4xl mx-auto w-full space-y-4 pb-20">

                        {/* Top Action Bar */}
                        <div className="flex justify-between items-center no-print px-2">
                            <button
                                onClick={() => router.push('/pharmacy/sales')}
                                className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-semibold text-xs uppercase tracking-wider"
                            >
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Back to Billing
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownloadInvoice}
                                    className="flex items-center gap-2 px-5 py-2 bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-md hover:bg-orange-800 transition-all"
                                >
                                    <span className="material-symbols-outlined text-base">verified_user</span>
                                    Download Secure Bill
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-md hover:bg-slate-800 transition-all"
                                >
                                    <span className="material-symbols-outlined text-base">print</span>
                                    Print View
                                </button>
                            </div>
                        </div>

                        {/* REAL BILL LAYOUT (Perfect for UI & Print) */}
                        <div id="printable-invoice" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none p-6 md:p-8 print:p-0 print:min-h-[277mm] print:flex print:flex-col">

                            {/* Top Content (Header + Meta) */}
                            <div className="print:flex-none">
                                {/* Bill Header */}
                                <div className="flex justify-between items-start border-b border-slate-200 pb-5 print:pb-4">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase print:text-lg">{dynamicHospitalName}</h2>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Retail Pharmacy Invoice</p>
                                    </div>
                                    <div className="text-right">
                                        <h1 className="text-xl font-black text-slate-400 tracking-widest uppercase print:text-lg">INVOICE</h1>
                                        <p className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block print:bg-transparent print:p-0">{sale.invoiceNumber}</p>
                                    </div>
                                </div>

                                {/* Meta Info Grid */}
                                <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs print:py-3">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Patient Details</p>
                                        <p className="font-black text-slate-800 text-sm uppercase">{sale.customerName || 'Walk-in Customer'}</p>
                                        {sale.patientCode ? (
                                            <p className="text-slate-600 font-medium">Patient ID: <span className="font-bold text-slate-900">{sale.patientCode}</span></p>
                                        ) : (
                                            <p className="text-slate-600 font-medium">Contact: {sale.customerPhone || 'N/A'}</p>
                                        )}
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Meta Info</p>
                                        <p className="text-slate-700 font-medium">Date: <span className="font-bold text-slate-900">{new Date(sale.createdAt).toLocaleString()}</span></p>
                                        <p className="text-slate-700 font-medium">Doctor: <span className="font-bold text-slate-900 uppercase">{sale.doctorName || sale.externalDoctorName || 'Hospital Doctor'}</span></p>
                                        <p className="text-slate-700 font-medium">Pharmacist: <span className="font-bold text-slate-900 uppercase">{user?.fullName || 'Duty Manager'}</span></p>
                                    </div>
                                </div>

                                {/* Status Pill for UI */}
                                <div className="pt-4 no-print">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 uppercase tracking-wider">
                                        {sale.status}
                                    </span>
                                </div>
                            </div>

                            {/* Items Table - This expands to fill space */}
                            <div className="mt-5 print:mt-4 print:flex-grow">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="border-b-2 border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 print:bg-transparent">
                                        <th className="py-2 px-3 text-left w-[45%]">Item Name</th>
                                        <th className="py-2 px-2 text-center">Batch</th>
                                        <th className="py-2 px-2 text-center">Qty</th>
                                        <th className="py-2 px-2 text-right">Price</th>
                                        <th className="py-2 px-2 text-right">Disc</th>
                                        <th className="py-2 px-3 text-right">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 text-xs">
                                    {sale.items.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                                            <td className="py-2.5 px-3 font-bold text-slate-800 uppercase">{item.medicineName}</td>
                                            <td className="py-2.5 px-2 text-center font-mono text-slate-600 font-semibold">{item.batchNumber || '-'}</td>
                                            <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                                            <td className="py-2.5 px-2 text-right font-medium text-slate-600">{formatCurrency(item.unitPrice)}</td>
                                            <td className="py-2.5 px-2 text-right font-medium text-emerald-600">
                                                {item.discountAmount ? `-${formatCurrency(item.discountAmount)}` : '0.00'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(item.netAmount)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bottom Content (Summary + Footer) */}
                            <div className="print:flex-none">
                                {/* Calculation Summary */}
                                <div className="mt-4 border-t border-slate-200 pt-4 flex justify-end">
                                    <div className="w-64 space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-600 font-medium">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-600 font-medium">
                                            <span>Total Discount:</span>
                                            <span>-{formatCurrency(totalDiscount)}</span>
                                        </div>
                                        {sale.taxAmount !== undefined && sale.taxAmount > 0 && (
                                            <div className="flex justify-between text-slate-600 font-medium">
                                                <span>Total Tax:</span>
                                                <span>{formatCurrency(sale.taxAmount)}</span>
                                            </div>
                                        )}
                                        <div className="border-t-2 border-double border-slate-300 pt-2 flex justify-between items-center text-slate-900">
                                            <span className="font-bold uppercase tracking-wider text-[10px]">Grand Total:</span>
                                            <span className="text-xl font-black tracking-tight">{formatCurrency(sale.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tax Breakdown (Optional detailed view) */}
                                {sale.taxAmount !== undefined && sale.taxAmount > 0 && (
                                    <div className="mt-2 flex justify-end">
                                        <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                                            {(() => {
                                                const aggregated: { taxName: string; taxAmount: number }[] = [];
                                                for (const item of sale.items) {
                                                    for (const tax of (item.appliedTaxes || [])) {
                                                        const existing = aggregated.find(a => a.taxName === tax.taxName);
                                                        if (existing) {
                                                            existing.taxAmount += tax.taxAmount;
                                                        } else {
                                                            aggregated.push({ taxName: tax.taxName, taxAmount: tax.taxAmount });
                                                        }
                                                    }
                                                }
                                                return aggregated.map(tax => (
                                                    <span key={tax.taxName} className="text-[8px] font-bold text-slate-400 uppercase">
                                                        {tax.taxName}: {formatCurrency(tax.taxAmount)}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* Terms & Footer */}
                                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1 font-medium print:mt-12">
                                    <p className="uppercase tracking-widest font-bold text-slate-500">Thank you for your business!</p>
                                    <p>Medicines once sold will not be taken back without a valid receipt.</p>
                                    <p className="text-[9px] text-slate-300 italic">This is a computer-generated invoice and requires no physical signature.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageSurface>

            {/* CSS to ensure Print Mode looks absolutely perfect */}
            <style jsx global>{`
                @media print {
                    /* Hide all UI elements marked with no-print */
                    .no-print, 
                    nav, 
                    aside, 
                    header, 
                    footer, 
                    .sidebar, 
                    .topbar {
                        display: none !important;
                    }

                    /* Reset body and container for printing */
                    body, html {
                        background: #fff !important;
                        color: #000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* Ensure the main container doesn't have restrictive styles */
                    main, .PageSurface, .MainLayout {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                        display: block !important;
                        overflow: visible !important;
                        width: 100% !important;
                        max-width: none !important;
                    }

                    #printable-invoice {
                        border: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20mm !important; /* Standard print padding */
                        width: 100% !important;
                        display: block !important;
                        background: white !important;
                    }

                    /* Page setup */
                    @page {
                        size: A4;
                        margin: 0;
                    }

                    /* Typography adjustments for print */
                    h1, h2, p, span, td, th {
                        color: #000 !important;
                    }

                    /* Prevent table rows from breaking across pages */
                    table {
                        width: 100% !important;
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    thead {
                        display: table-header-group;
                    }
                }
            `}</style>
        </MainLayout>
    );
};

export default PharmacySaleDetailPage;