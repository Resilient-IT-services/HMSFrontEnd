'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { pharmacyApi } from '@/modules/pharmacy/api/pharmacyApi';
import { patientService } from '@/services/patientService';
import LoadingSkeleton from '@/modules/pharmacy/components/LoadingSkeleton';
import { triggerGlobalToast } from '@/components/ui/Toast';
import StatusBadge from '@/modules/pharmacy/components/StatusBadge';
import MedicineAutocomplete from '@/modules/pharmacy/components/MedicineAutocomplete';
import { Badge } from '@/components/ui/Badge';
import { PageSurface } from '@/components/ui/PageSurface';
import dayjs from 'dayjs';

interface BillItem {
    key: string;
    id: string;
    name: string;
    dosage: string;
    duration: string;
    quantity: number;
    price: number;
    isManual: boolean;
    outOfStock: boolean;
    isExpired: boolean;
    totalAvailable: number;
    batchNumber?: string;
    medicineBatchId?: string;
}

interface PrescriptionDetailPageProps {
    id: string;
}

const PrescriptionDetailPage: React.FC<PrescriptionDetailPageProps> = ({ id }) => {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    const [prescription, setPrescription] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [dispensing, setDispensing] = useState(false);
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
    const [patientCode, setPatientCode] = useState<string>('N/A');

    const resolveStockAndPrice = useCallback(async (medicineId: string, medicineName: string) => {
        let price = 0;
        let totalAvailable = 0;
        let batchNumber = 'N/A';
        let medicineBatchId;
        let isExpired = false;

        try {
            const stockRes = await pharmacyApi.getMedicineStock({
                medicineId: medicineId || undefined,
                search: medicineId ? undefined : medicineName
            });

            if (stockRes.success && stockRes.data?.content) {
                const matches = medicineId
                    ? stockRes.data.content
                    : stockRes.data.content.filter(s => s.medicineName.toLowerCase() === medicineName.toLowerCase());

                totalAvailable = matches.reduce((acc, s) => acc + (s.quantity || 0), 0);

                const firstAvailable = matches.find(s => (s.quantity || 0) > 0);
                if (firstAvailable) {
                    price = firstAvailable.sellingPrice || firstAvailable.price || 0;
                    batchNumber = firstAvailable.batchNumber || 'N/A';
                    medicineBatchId = firstAvailable.id;
                    if (firstAvailable.expiryDate) {
                        isExpired = dayjs(firstAvailable.expiryDate).isBefore(dayjs(), 'day');
                    }
                }
            }

            if (price === 0 && medicineId && !medicineId.startsWith('stock-') && medicineId.trim() !== '') {
                const medRes = await pharmacyApi.getMedicineById(medicineId);
                if (medRes.success && medRes.data) {
                    price = medRes.data.sellingPrice || medRes.data.purchasePrice || 0;
                }
            }
        } catch {
            // Silently fail as fallback to 0 price/stock
        }

        return { price, totalAvailable, outOfStock: totalAvailable === 0, isExpired, batchNumber, medicineBatchId };
    }, []);

    const fetchPatientData = useCallback(async (rxData: any) => {
        if (!rxData.patientId) return rxData;
        try {
            const patientRes = await patientService.get(rxData.patientId);
            if (patientRes.success && patientRes.data) {
                const updatedData = { ...rxData };
                if (patientRes.data.phone) {
                    updatedData.phone = patientRes.data.phone;
                }
                if (patientRes.data.patientCode) {
                    setPatientCode(patientRes.data.patientCode);
                }
                return updatedData;
            }
        } catch {
            console.warn('Failed to fetch patient profile metadata');
        }
        return rxData;
    }, []);

    const transformPrescriptionItems = useCallback(async (items: any[]) => {
        return Promise.all(items.map(async (item: any, idx: number) => {
            const stockInfo = await resolveStockAndPrice(item.medicineId || '', item.medicineName);
            return {
                key: `api-${item.medicineId || idx}-${Date.now()}`,
                id: item.medicineId || '',
                name: item.medicineName,
                dosage: item.dosage,
                duration: item.duration,
                quantity: (stockInfo.outOfStock || stockInfo.isExpired) ? 0 : 1,
                price: stockInfo.price,
                isManual: false,
                outOfStock: stockInfo.outOfStock,
                isExpired: stockInfo.isExpired,
                totalAvailable: stockInfo.totalAvailable,
                batchNumber: stockInfo.batchNumber,
                medicineBatchId: stockInfo.medicineBatchId
            };
        }));
    }, [resolveStockAndPrice]);

    useEffect(() => {
        const init = async () => {
            if (!id) return;
            try {
                setLoading(true);
                let savedData = null;
                if (globalThis.window !== undefined) {
                    const saved = globalThis.window.sessionStorage.getItem(`rx_draft_${id}`);
                    if (saved) savedData = JSON.parse(saved);
                }

                const rxRes = await pharmacyApi.getPrescriptionById(id);
                if (rxRes.success && rxRes.data) {
                    const rxData = await fetchPatientData(rxRes.data);
                    setPrescription(rxData);

                    if (savedData) {
                        setBillItems(savedData);
                    } else {
                        const items = await transformPrescriptionItems(rxData.items);
                        setBillItems(items);
                    }
                }
            } catch {
                triggerGlobalToast('Failed to load prescription pipeline', 'error');
            } finally {
                setLoading(false);
                setIsReady(true);
            }
        };
        void init();
    }, [id, fetchPatientData, transformPrescriptionItems]);

    useEffect(() => {
        if (isReady && id && globalThis.window !== undefined) {
            if (billItems.length > 0) {
                globalThis.window.sessionStorage.setItem(`rx_draft_${id}`, JSON.stringify(billItems));
            } else {
                globalThis.window.sessionStorage.removeItem(`rx_draft_${id}`);
            }
        }
    }, [billItems, id, isReady]);

    const handleAddMedicine = async (medicine: any) => {
        const mid = medicine.medicineId || medicine.id || '';
        if (billItems.some(item => item.id === mid)) {
            triggerGlobalToast(`${medicine.name} is already added to the bill`, 'warning');
            return;
        }

        const stockInfo = await resolveStockAndPrice(mid, medicine.name);
        const newItem: BillItem = {
            key: `manual-${mid}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            id: mid,
            name: medicine.name,
            dosage: '-',
            duration: '-',
            quantity: (stockInfo.outOfStock || stockInfo.isExpired) ? 0 : 1,
            price: stockInfo.price,
            isManual: true,
            outOfStock: stockInfo.outOfStock,
            isExpired: stockInfo.isExpired,
            totalAvailable: stockInfo.totalAvailable,
            batchNumber: stockInfo.batchNumber,
            medicineBatchId: stockInfo.medicineBatchId
        };

        setBillItems(prev => [...prev, newItem]);
        if (stockInfo.outOfStock) {
            triggerGlobalToast(`${medicine.name} is currently out of stock`, 'warning');
        } else if (stockInfo.isExpired) {
            triggerGlobalToast(`${medicine.name} (Batch: ${stockInfo.batchNumber}) has EXPIRED`, 'error');
        } else {
            triggerGlobalToast(`${medicine.name} added to bill`, 'success');
        }
    };

    const handleRemoveItem = (key: string) => {
        setBillItems(prev => prev.filter(item => item.key !== key));
    };

    const handleQuantityChange = (key: string, value: string) => {
        const item = billItems.find(i => i.key === key);
        if (item?.outOfStock || item?.isExpired) return;

        const qty = Math.max(0, Number.parseInt(value, 10) || 0);
        if (item && qty > item.totalAvailable) {
            triggerGlobalToast(`Only ${item.totalAvailable} units available in stock`, 'warning');
            return;
        }

        setBillItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i));
    };

    const subtotal = billItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const tax = subtotal * 0.12;
    const grandTotal = subtotal + tax;

    const handleDispense = async () => {
        if (!id || !prescription) return;
        const validItems = billItems.filter(item => item.id && !item.outOfStock && !item.isExpired && item.quantity > 0);
        if (validItems.length === 0) {
            triggerGlobalToast('No valid in-stock/unexpired medicines selected.', 'error');
            return;
        }

        try {
            setDispensing(true);
            const res = await pharmacyApi.dispensePrescription(id, {
                saleType: 'VISIT',
                patientId: prescription.patientId,
                prescriptionId: prescription.id,
                visitId: prescription.visitId,
                doctorId: prescription.doctorId || null,
                customerName: prescription.patientName || '',
                customerPhone: prescription.phone || '',
                items: validItems.map(item => ({
                    medicineId: item.id,
                    medicineBatchId: item.medicineBatchId || null,
                    quantity: item.quantity
                })),
                payment: { amount: grandTotal, mode: paymentMode, referenceNumber: `AUTO-${Date.now()}` }
            });

            if (res.success) {
                triggerGlobalToast('Prescription dispensed successfully!', 'success');
                if (globalThis.window !== undefined) globalThis.window.sessionStorage.removeItem(`rx_draft_${id}`);
                setTimeout(() => {
                    if (globalThis.window !== undefined) globalThis.window.print();
                    router.push('/pharmacy/prescriptions');
                }, 300);
            } else {
                triggerGlobalToast(res.message || 'Dispensing failed', 'error');
            }
        } catch (error: any) {
            triggerGlobalToast(error.response?.data?.message || 'Dispensing failed', 'error');
        } finally {
            setDispensing(false);
        }
    };

    if (loading) {
        return (
            <MainLayout title="Loading..." hideTitle>
                <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
                    <LoadingSkeleton />
                </PageSurface>
            </MainLayout>
        );
    }

    if (!prescription) {
        return (
            <MainLayout title="Not Found" hideTitle>
                <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
                    <div className="p-8 text-center text-slate-500 font-bold">Prescription data could not be fetched.</div>
                </PageSurface>
            </MainLayout>
        );
    }

    const isFinalized = prescription.status === 'COMPLETED' || prescription.status === 'DISPENSED';
    const loggedInHospitalName = user?.memberships.find(m => m.hospitalId === user.currentHospitalId)?.hospitalName;
    const dynamicHospitalName = prescription.hospitalName || loggedInHospitalName || 'CAREFLOW HOSPITAL & MEDICAL RESEARCH';

    return (
        <MainLayout title={`Dispense Order: #RX-${id}`} hideTitle>
            {/* --- ✅ ULTRA-COMPRESSED LIGHT ORANGE PROJECT THEME PRINT LAYER --- */}
            <div className="hidden print:block bg-[#fffaf5] text-black p-4 font-sans print-forced-isolated-root relative min-h-screen">
                <style>{`
          @media print {
            html, body, #__next, main, [data-reactroot], .print\\:block {
              display: block !important;
              height: auto !important;
              min-height: auto !important;
              overflow: visible !important;
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fffaf5 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden; }
            .print-forced-isolated-root, .print-forced-isolated-root * { visibility: visible; }
            .print-forced-isolated-root { display: block !important; width: 100% !important; height: auto !important; overflow: visible !important; background: #fffaf5 !important; }
            
            /* Ultra compressed setup with theme color background layout */
            .print-sheet { display: block !important; width: 100% !important; height: auto !important; overflow: visible !important; position: relative; z-index: 10; padding: 2px !important; }
            
            /* Clean Compact Table with Project Orange Tint Headers */
            .minimal-grid-table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 0.6rem !important;
              margin-bottom: 0.6rem !important;
              page-break-inside: auto !important;
            }
            .minimal-grid-table th {
              border: 1px solid #e6d5c3 !important;
              padding: 4px 6px !important;
              font-weight: 700 !important;
              font-size: 11px !important;
              color: #5c3a21 !important;
              background-color: #fff3e6 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .minimal-grid-table td {
              border: 1px solid #e6d5c3 !important;
              padding: 4px 6px !important;
              font-size: 11px !important;
              color: #2b221a !important;
              background-color: #ffffff !important;
            }
            tr { page-break-inside: avoid !important; page-break-after: auto !important; }
            tbody { display: table-row-group !important; }
            thead { display: table-header-group !important; }
            
            /* Dynamic Project Orange / Coral Theme Total Strip Box */
            .dark-total-box {
              background-color: #c25100 !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 6px 10px !important;
              font-weight: 700 !important;
              font-size: 12px !important;
              display: flex !important;
              justify-content: space-between !important;
              width: 200px !important;
              margin-top: 4px !important;
              border-radius: 4px;
            }
            
            @page { size: A4; margin: 8mm; }
          }
        `}</style>

                <div className="print-sheet relative z-10">
                    <div className="mb-4 border-b pb-2 border-[#e6d5c3]">
                        <h1 className="text-xl font-black tracking-tight text-[#c25100] uppercase m-0 leading-tight">{dynamicHospitalName}</h1>
                        <p className="text-[9px] text-[#8a6d55] font-bold uppercase tracking-wider m-0 mt-0.5">Pharmacy Invoice Department</p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-[11px] border-none mb-4">
                        <div>
                            <p className="font-bold text-[#5c3a21] m-0">Invoice number</p>
                            <p className="text-slate-700 m-0 font-medium">#INV-{id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="font-bold text-[#5c3a21] m-0">Date of issue</p>
                            <p className="text-slate-700 m-0 font-medium">{new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="pt-0.5">
                            <p className="font-bold text-[#5c3a21] m-0">Billed to</p>
                            <p className="text-black font-bold m-0">{prescription.patientName}</p>
                            <p className="text-slate-600 m-0">Phone: {prescription.phone || 'N/A'} • Code: {patientCode}</p>
                        </div>
                        <div className="pt-0.5">
                            <p className="font-bold text-[#5c3a21] m-0">Billed by</p>
                            <p className="text-slate-600 m-0">Doctor: Dr. {prescription.doctorName}</p>
                            <p className="text-slate-600 m-0">Pharmacist: {user?.fullName}</p>
                        </div>
                    </div>

                    <table className="minimal-grid-table">
                        <thead>
                        <tr>
                            <th className="text-left" style={{ width: '48%' }}>Description</th>
                            <th className="text-center" style={{ width: '12%' }}>Dose</th>
                            <th className="text-center" style={{ width: '12%' }}>Qty</th>
                            <th className="text-right" style={{ width: '14%' }}>Price/Unit</th>
                            <th className="text-right" style={{ width: '14%' }}>Amount</th>
                        </tr>
                        </thead>
                        <tbody>
                        {billItems.filter(i => !i.outOfStock && !i.isExpired && i.quantity > 0).map((item, idx) => (
                            <tr key={idx}>
                                <td className="text-left font-medium">{item.name}</td>
                                <td className="text-center font-bold text-[#c25100]">{item.dosage}</td>
                                <td className="text-center font-bold">{item.quantity}</td>
                                <td className="text-right">₹{item.price.toFixed(2)}</td>
                                <td className="text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="flex flex-col items-end w-full mt-2 text-[11px]">
                        <div className="w-[200px] flex justify-between py-0.5 px-0.5 text-slate-700 font-semibold">
                            <span>Subtotal</span>
                            <span className="text-black font-bold">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="w-[200px] flex justify-between py-0.5 px-0.5 text-slate-500 font-medium italic">
                            <span>Tax rate</span>
                            <span>12.00%</span>
                        </div>
                        <div className="w-[200px] flex justify-between py-0.5 px-0.5 text-slate-700 font-semibold mb-0.5">
                            <span>Tax (GST)</span>
                            <span className="text-black font-bold">₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="dark-total-box">
                            <span className="uppercase tracking-wider text-[9px] font-bold text-orange-100 flex items-center">Invoice total</span>
                            <span className="text-sm font-black text-white">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-8 pt-2 border-t border-[#e6d5c3]">
                        <p className="text-[10px] text-[#8a6d55] font-medium m-0">This is a system-generated invoice from pharmacy database logs. No manual signature required.</p>
                    </div>
                </div>
            </div>

            {/* --- STANDARD SCREEN VIEW WORKAREA --- */}
            <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start py-2 md:py-4 h-[calc(100vh-80px)] overflow-hidden">

                    {/* --- LEFT SIDE: BILLING COUNTER AREA (2 COLUMNS) --- */}
                    <div className="lg:col-span-2 space-y-4 h-full flex flex-col min-h-0">

                        <section className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                <span className="material-symbols-outlined text-xl">person</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Patient Details ({patientCode})</p>
                                <p className="text-base font-bold text-slate-900 truncate">{prescription.patientName}</p>
                                <p className="text-xs text-slate-500 font-medium truncate">Mob: {prescription.phone || 'N/A'}</p>
                            </div>
                            <div className="shrink-0 scale-90">
                                <StatusBadge status={prescription.status || 'ACTIVE'} />
                            </div>
                        </section>

                        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 shrink-0">
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Billing Counter</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Medication checkout logs</p>
                                </div>
                                <div className="w-full sm:w-72 shrink-0">
                                    <MedicineAutocomplete onSelect={handleAddMedicine} placeholder="Search & add extra medicines..." stockOnly={true} />
                                </div>
                            </div>

                            <div className="p-4 overflow-y-auto space-y-2 flex-1 min-h-0 scrollbar-thin">
                                {billItems.map((item) => (
                                    <div key={item.key} className={`flex items-center gap-4 p-2 border rounded-xl transition-all shadow-sm shrink-0 ${
                                        (item.outOfStock || item.isExpired) ? 'bg-red-50/40 border-red-100' : 'bg-white border-slate-200 hover:border-orange-200'
                                    }`}>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-xs font-bold truncate ${ (item.outOfStock || item.isExpired) ? 'text-red-900' : 'text-slate-900'}`}>{item.name}</p>
                                                {item.isManual && <Badge variant="blue" className="text-[8px] px-1 py-0 font-black tracking-wide">MANUAL</Badge>}
                                                {item.outOfStock && <Badge variant="red" className="text-[8px] px-1 py-0 font-black uppercase">OOS</Badge>}
                                                {item.isExpired && <Badge variant="red" className="text-[8px] px-1 py-0 font-black uppercase">EXPIRED</Badge>}
                                            </div>
                                            <p className={`text-[10px] font-semibold font-mono tracking-tight mt-0.5 ${item.isExpired ? 'text-red-600' : 'text-slate-400'}`}>Batch: {item.batchNumber || 'N/A'}</p>
                                        </div>

                                        <div className="flex items-center gap-2 px-4 border-l border-r border-slate-100 shrink-0">
                                            <input
                                                type="number"
                                                value={item.quantity === 0 ? '' : item.quantity}
                                                onChange={(e) => handleQuantityChange(item.key, e.target.value)}
                                                className={`w-14 px-1.5 py-1 border rounded-md text-xs text-center font-black outline-none focus:border-orange-500 shadow-sm ${
                                                    (item.outOfStock || item.isExpired) ? 'bg-white text-red-400 cursor-not-allowed border-red-100' : 'bg-slate-50 border-slate-200 text-slate-700'
                                                }`}
                                                min="0"
                                                disabled={item.outOfStock || item.isExpired}
                                            />
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">QTY</span>
                                        </div>

                                        <div className="text-right min-w-[100px] shrink-0">
                                            <p className="text-[10px] font-bold text-slate-400">Rate: ₹{(Number(item.price) || 0).toFixed(2)}</p>
                                            <p className={`text-xs font-black tracking-tight ${(item.outOfStock || item.isExpired) ? 'text-red-600' : 'text-slate-900'}`}>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                                        </div>

                                        <button onClick={() => handleRemoveItem(item.key)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}

                                {billItems.length === 0 && (
                                    <div className="py-16 text-center text-slate-400 text-xs font-medium">
                                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">inventory_2</span>
                                        No medications present on terminal table.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-4 h-full flex flex-col shrink-0">
                        <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                                <span className="material-symbols-outlined text-xl">stethoscope</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Prescribed Doctor</p>
                                <p className="text-base font-bold text-slate-900 truncate">Dr. {prescription.doctorName}</p>
                                <p className="text-xs text-slate-400 font-medium truncate">Medical Unit Officer</p>
                            </div>
                        </section>

                        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Doctor's Original Rx</p>
                            <div className="flex flex-col gap-1.5 h-[148px] overflow-y-auto pr-1 scrollbar-thin">
                                {prescription.items.map((item: any, idx: number) => (
                                    <div key={idx} className="px-2.5 py-2 bg-slate-50 rounded-lg border border-slate-100 font-semibold text-xs text-slate-700 flex items-center justify-between shrink-0 shadow-inner">
                                        <span className="truncate">{item.medicineName}</span>
                                        <span className="text-[10px] text-slate-400 font-bold shrink-0 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                      {item.dosage || '101'}
                    </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-md shrink-0">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Summary Checkout</h2>

                            <div className="space-y-1.5 text-xs font-bold text-slate-600 mb-3 border-b pb-2.5 border-dashed border-slate-100">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="text-slate-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-400 italic font-medium">
                                    <span>GST (12%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="pt-1.5 flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-800 uppercase">Total Amount</span>
                                    <span className="text-xl font-black text-orange-700">₹{grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {!isFinalized && (
                                <div className="mb-3">
                                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1.5">Payment Method</p>
                                    <div className="grid grid-cols-3 gap-1">
                                        {(['CASH', 'CARD', 'UPI'] as const).map((mode) => (
                                            <button key={mode} onClick={() => setPaymentMode(mode)} className={`py-1 rounded text-[10px] font-black uppercase border transition-all ${
                                                paymentMode === mode ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}>{mode}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                {isFinalized ? (
                                    <button onClick={() => globalThis.window !== undefined && globalThis.window.print()} className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-black transition-all">
                                        <span className="material-symbols-outlined text-sm">print</span> Print Invoice
                                    </button>
                                ) : (
                                    <button onClick={handleDispense} disabled={dispensing || billItems.length === 0} className="w-full py-2.5 bg-orange-700 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-orange-800 transition-all disabled:opacity-50">
                                        <span className="material-symbols-outlined text-sm">payments</span> {dispensing ? 'Processing...' : 'Complete Dispense'}
                                    </button>
                                )}

                                <button onClick={() => globalThis.window !== undefined && globalThis.window.print()} className="w-full py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">print</span> Print Draft Bill
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </PageSurface>
        </MainLayout>
    );
};

export default PrescriptionDetailPage;