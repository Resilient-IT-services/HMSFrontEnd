'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { labApi, LabTestParameterDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface LabResultEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderTestId: string;
    testName: string;
    resultEntryType: string;
}

const LabResultEntryModal: React.FC<LabResultEntryModalProps> = ({
    isOpen,
    onClose,
    orderTestId,
    testName,
    resultEntryType
}) => {
    const [parameters, setParameters] = useState<LabTestParameterDTO[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [findings, setFindings] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && orderTestId && resultEntryType?.toUpperCase() === 'PARAMETER') {
            const fetchParams = async () => {
                try {
                    setLoading(true);
                    const res = await labApi.getParametersByOrderTest(orderTestId);
                    if (res.success && res.data) {
                        setParameters(res.data);
                        const initial: Record<string, string> = {};
                        res.data.forEach(p => {
                            if (p.id) initial[p.id] = p.resultValue || '';
                        });
                        setResults(initial);
                    }
                } catch (error) {
                    console.error('Failed to fetch parameters:', error);
                    triggerGlobalToast('Failed to load test parameters', 'error');
                } finally {
                    setLoading(false);
                }
            };
            void fetchParams();
        }
    }, [isOpen, orderTestId, resultEntryType]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                orderTestId: orderTestId,
                findings: resultEntryType?.toUpperCase() === 'NARRATIVE' ? findings : undefined,
                results: resultEntryType?.toUpperCase() === 'PARAMETER' ? Object.entries(results).map(([parameterId, value]) => ({
                    parameterId: parameterId,
                    value: value,
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${testName} - Result Entry`} size={resultEntryType?.toUpperCase() === 'NARRATIVE' ? '2xl' : 'xl'}>
            <div className="space-y-6">
                {loading ? (
                    <div className="py-10 text-center italic text-slate-400 font-bold">Loading test parameters...</div>
                ) : resultEntryType?.toUpperCase() === 'NARRATIVE' ? (
                    <div className="p-4 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Findings / Report Text</label>
                        <textarea
                            className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all resize-none"
                            placeholder="Enter detailed findings here..."
                            value={findings}
                            onChange={(e) => setFindings(e.target.value)}
                        />
                    </div>
                ) : parameters.length === 0 ? (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-2 mx-4">
                       <p className="text-sm font-bold text-orange-600">No parameters defined for this test.</p>
                       <p className="text-xs text-orange-500/70">Please configure the global test master to include parameters.</p>
                    </div>
                ) : (
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
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 p-4">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving} disabled={loading || (resultEntryType?.toUpperCase() === 'PARAMETER' && parameters.length === 0)}>
                        {resultEntryType?.toUpperCase() === 'NARRATIVE' ? 'Complete Findings' : 'Complete & Save'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default LabResultEntryModal;
