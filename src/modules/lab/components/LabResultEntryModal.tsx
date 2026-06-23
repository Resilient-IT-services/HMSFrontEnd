'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { labApi, LabPackageResultBundleDTO, LabTestParameterDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface LabResultEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderTestId?: string;
    orderId?: string;
    testName: string;
    resultEntryType?: string;
    packageId?: string;
}

type PackageResultsState = Record<string, {
    findings: string;
    values: Record<string, string>;
}>;

const LabResultEntryModal: React.FC<LabResultEntryModalProps> = ({
    isOpen,
    onClose,
    orderTestId,
    orderId,
    testName,
    resultEntryType,
    packageId
}) => {
    const isPackageMode = Boolean(orderId && packageId);
    const [parameters, setParameters] = useState<LabTestParameterDTO[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [findings, setFindings] = useState('');
    const [packageBundle, setPackageBundle] = useState<LabPackageResultBundleDTO | null>(null);
    const [packageResults, setPackageResults] = useState<PackageResultsState>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                if (isPackageMode && orderId && packageId) {
                    const res = await labApi.getPackageResultBundle(orderId, packageId);
                    if (res.success && res.data) {
                        setPackageBundle(res.data);
                        const initialState: PackageResultsState = {};
                        res.data.tests.forEach(test => {
                            initialState[test.orderTestId] = {
                                findings: test.findings || '',
                                values: Object.fromEntries((test.parameters || []).map(param => [param.id!, param.resultValue || '']))
                            };
                        });
                        setPackageResults(initialState);
                    }
                    return;
                }

                if (orderTestId && resultEntryType?.toUpperCase() === 'PARAMETER') {
                    const res = await labApi.getParametersByOrderTest(orderTestId);
                    if (res.success && res.data) {
                        setParameters(res.data);
                        const initial: Record<string, string> = {};
                        res.data.forEach(p => {
                            if (p.id) initial[p.id] = p.resultValue || '';
                        });
                        setResults(initial);
                    }
                }
            } catch (error) {
                console.error('Failed to load result entry data:', error);
                triggerGlobalToast('Failed to load result entry data', 'error');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [isOpen, isPackageMode, orderId, orderTestId, packageId, resultEntryType]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (isPackageMode && orderId && packageId && packageBundle) {
                const payload = {
                    orderId,
                    packageId,
                    tests: packageBundle.tests.map(test => ({
                        orderTestId: test.orderTestId,
                        findings: test.resultEntryType?.toUpperCase() === 'NARRATIVE' ? (packageResults[test.orderTestId]?.findings || '') : undefined,
                        results: test.resultEntryType?.toUpperCase() === 'PARAMETER'
                            ? (test.parameters || []).map(param => ({
                                parameterId: param.id,
                                value: packageResults[test.orderTestId]?.values?.[param.id!] || '',
                                abnormal: false,
                                critical: false
                            }))
                            : []
                    }))
                };
                const res = await labApi.savePackageResults(payload);
                if (res.success) {
                    triggerGlobalToast('Package results saved successfully', 'success');
                    onClose();
                }
                return;
            }

            const payload = {
                orderTestId: orderTestId!,
                findings: resultEntryType?.toUpperCase() === 'NARRATIVE' ? findings : undefined,
                results: resultEntryType?.toUpperCase() === 'PARAMETER' ? Object.entries(results).map(([parameterId, value]) => ({
                    parameterId,
                    value,
                    abnormal: false,
                    critical: false
                })) : []
            };
            const res = await labApi.saveResults(payload);
            if (res.success) {
                triggerGlobalToast('Results saved successfully', 'success');
                onClose();
            }
        } catch (error) {
            console.error('Failed to save results:', error);
            triggerGlobalToast('Failed to save results', 'error');
        } finally {
            setSaving(false);
        }
    };

    const renderSingleTest = () => {
        if (resultEntryType?.toUpperCase() === 'NARRATIVE') {
            return (
                <div className="p-4 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Findings / Report Text</label>
                    <textarea
                        className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all resize-none"
                        placeholder="Enter detailed findings here..."
                        value={findings}
                        onChange={(e) => setFindings(e.target.value)}
                    />
                </div>
            );
        }

        if (parameters.length === 0) {
            return (
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-2 mx-4">
                    <p className="text-sm font-bold text-orange-600">No parameters defined for this test.</p>
                    <p className="text-xs text-orange-500/70">Please configure the global test master to include parameters.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4 p-4">
                {parameters.map((param) => (
                    <div key={param.id} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-tight">{param.parameterName}</label>
                            {param.unit && <span className="ml-1 text-[10px] text-slate-400 font-bold">({param.unit})</span>}
                        </div>
                        <div className="col-span-6">
                            <input
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                                placeholder={`Enter ${param.parameterName} value`}
                                value={results[param.id!] || ''}
                                onChange={(e) => setResults({ ...results, [param.id!]: e.target.value })}
                            />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPackage = () => {
        if (!packageBundle) {
            return null;
        }

        return (
            <div className="space-y-4 p-4">
                {packageBundle.tests.map(test => (
                    <section key={test.orderTestId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h4 className="text-sm font-black text-slate-900">{test.testName}</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{test.resultEntryType}</p>
                            </div>
                            <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500 uppercase">
                                {test.status}
                            </span>
                        </div>

                        {test.resultEntryType?.toUpperCase() === 'NARRATIVE' ? (
                            <textarea
                                className="w-full h-32 bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-primary transition-all resize-none"
                                placeholder={`Enter findings for ${test.testName}`}
                                value={packageResults[test.orderTestId]?.findings || ''}
                                onChange={(e) => setPackageResults(prev => ({
                                    ...prev,
                                    [test.orderTestId]: {
                                        findings: e.target.value,
                                        values: prev[test.orderTestId]?.values || {}
                                    }
                                }))}
                            />
                        ) : (
                            <div className="space-y-3">
                                {(test.parameters || []).map(param => (
                                    <div key={param.id} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-6">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-tight">{param.parameterName}</label>
                                            {param.unit && <span className="ml-1 text-[10px] text-slate-400 font-bold">({param.unit})</span>}
                                        </div>
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
                                                placeholder={`Enter ${param.parameterName} value`}
                                                value={packageResults[test.orderTestId]?.values?.[param.id!] || ''}
                                                onChange={(e) => setPackageResults(prev => ({
                                                    ...prev,
                                                    [test.orderTestId]: {
                                                        findings: prev[test.orderTestId]?.findings || '',
                                                        values: {
                                                            ...(prev[test.orderTestId]?.values || {}),
                                                            [param.id!]: e.target.value
                                                        }
                                                    }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${testName} - Result Entry`}
            size={isPackageMode || resultEntryType?.toUpperCase() === 'NARRATIVE' ? '2xl' : 'xl'}
        >
            <div className="space-y-6">
                {loading ? (
                    <div className="py-10 text-center italic text-slate-400 font-bold">Loading result form...</div>
                ) : isPackageMode ? renderPackage() : renderSingleTest()}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 p-4">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving} disabled={loading}>
                        {isPackageMode ? 'Save Package Results' : resultEntryType?.toUpperCase() === 'NARRATIVE' ? 'Complete Findings' : 'Complete & Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default LabResultEntryModal;
