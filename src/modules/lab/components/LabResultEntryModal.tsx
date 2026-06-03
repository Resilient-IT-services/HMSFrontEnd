'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { labApi, LabTestParameterDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

interface LabResultEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    orderTest: {
        id: string;
        testId: string;
        testName: string;
        testCode: string;
        patientName: string;
    };
}

export const LabResultEntryModal: React.FC<LabResultEntryModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    orderTest
}) => {
    const [parameters, setParameters] = useState<LabTestParameterDTO[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && orderTest.testId) {
            const fetchParams = async () => {
                setLoading(true);
                try {
                    const res = await labApi.getParametersByTest(orderTest.testId);
                    if (res.success && res.data) {
                        setParameters(res.data);
                        // Initialize results map
                        const initial: Record<string, string> = {};
                        res.data.forEach(p => {
                            if (p.id) initial[p.id] = '';
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
    }, [isOpen, orderTest.testId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                orderTestId: orderTest.id,
                results: Object.entries(results).map(([paramId, value]) => ({
                    parameterId: paramId,
                    value: value,
                    abnormal: false, // Could add logic for range checking here
                    critical: false
                }))
            };
            const res = await labApi.saveResults(payload);
            if (res.success) {
                triggerGlobalToast('Results saved successfully', 'success');
                onSuccess();
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Result Entry: ${orderTest.testName}`} size="xl">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                        <p className="text-sm font-black text-slate-900">{orderTest.patientName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Code</p>
                        <p className="text-sm font-black text-slate-700">{orderTest.testCode}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-10 text-center italic text-slate-400 font-bold">Loading parameters...</div>
                ) : (
                    <div className="space-y-4">
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
                                        placeholder="Enter value"
                                        value={results[param.id!] || ''}
                                        onChange={(e) => setResults({ ...results, [param.id!]: e.target.value })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} isLoading={saving} disabled={loading || parameters.length === 0}>Complete & Save</Button>
                </div>
            </div>
        </Modal>
    );
};
