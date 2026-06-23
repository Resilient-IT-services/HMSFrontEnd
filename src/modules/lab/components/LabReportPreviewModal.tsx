'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { labApi } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface LabReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export const LabReportPreviewModal: React.FC<LabReportPreviewModalProps> = ({
    isOpen,
    onClose,
    orderId
}) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && orderId) {
            const fetchPreview = async () => {
                setLoading(true);
                try {
                    const res = await labApi.getReportPreview(orderId);
                    if (res.success) {
                        setReport(res.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch report preview:', error);
                    triggerGlobalToast('Failed to load report preview', 'error');
                } finally {
                    setLoading(false);
                }
            };
            void fetchPreview();
        }
    }, [isOpen, orderId]);

    const handlePrint = () => {
        globalThis.print();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Laboratory Report Preview" size="xl">
            {loading ? (
                <div className="py-20 text-center italic text-slate-400 font-bold">Generating preview...</div>
            ) : report ? (
                <div className="p-8 bg-white print:p-0" id="lab-report-content">
                    {/* Report Header */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{report.hospitalName}</h1>
                            <p className="text-xs font-bold text-slate-500 max-w-xs">{report.hospitalAddress}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Laboratory Medicine Department</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-slate-900 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded mb-2">Final Report</div>
                            <p className="text-[10px] font-bold text-slate-500">Order #: <span className="text-slate-900">{report.orderNumber}</span></p>
                            <p className="text-[10px] font-bold text-slate-500">Date: <span className="text-slate-900">{new Date(report.orderedAt).toLocaleDateString()}</span></p>
                        </div>
                    </div>

                    {/* Patient Info Table */}
                    <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Patient Name</span>
                                <span className="text-xs font-black text-slate-900">{report.patientName}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Patient ID</span>
                                <span className="text-xs font-bold text-slate-700">{report.patientId}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Age / Gender</span>
                                <span className="text-xs font-bold text-slate-700">{report.patientAge} Yrs / {report.patientGender}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200 pb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Ref By</span>
                                <span className="text-xs font-black text-slate-900">Dr. {report.doctorName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="space-y-8">
                        {report.testGroups?.map((group: any, idx: number) => (
                            <div key={idx} className="overflow-hidden">
                                <h3 className="bg-slate-100 px-4 py-2 text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 mb-4">
                                    {group.testName} <span className="text-[9px] font-bold text-slate-400 ml-2">({group.departmentName})</span>
                                </h3>
                                <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                                    <thead>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Investigation</th>
                                            <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Observed Value</th>
                                            <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Unit</th>
                                            <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Reference Range</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {group.parameters?.map((param: any, pIdx: number) => (
                                            <tr key={pIdx} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{param.parameterName}</div></td>
                                                <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                                                    {param.resultValue}
                                                    {param.abnormal && <span className="ml-1 text-[10px] font-black">H</span>}
                                                </div></td>
                                                <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{param.unit || '--'}</div></td>
                                                <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{param.referenceRange}</div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    {/* Report Footer */}
                    <div className="mt-20 pt-10 border-t border-slate-100 flex justify-between items-end italic text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <div>
                            <p>End of Report</p>
                            <p className="mt-1 normal-case">Generated on {new Date().toLocaleString()}</p>
                        </div>
                        <div className="text-center border-t border-slate-900 pt-2 w-48 text-slate-900">
                            Authorized Signatory
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center text-slate-400 font-bold">No report data available.</div>
            )}

            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2rem]">
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button onClick={handlePrint} icon="print" disabled={!report}>Print Report</Button>
            </div>
        </Modal>
    );
};
