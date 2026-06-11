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
}

const LabResultEntryModal: React.FC<LabResultEntryModalProps> = ({
    isOpen,
    onClose,
    orderTestId
}) => {
    const [parameters, setParameters] = useState<LabTestParameterDTO[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // In a real scenario, we'd fetch the test details (name, code) using orderTestId.
    // For MVP, we'll just fetch the parameters directly.
    const [testId, setTestId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && orderTestId) {
            const fetchParams = async () => {
                try {
                    setLoading(true);
                    const res = await labApi.getParametersByOrderTest(orderTestId);
                    if (res.success && res.data) {
                        setParameters(res.data);
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
            fetchParams();
        }
    }, [isOpen, orderTestId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                orderTestId: orderTestId,
                results: Object.entries(results).map(([paramId, value]) => ({
                    parameterId: paramId,
                    value: value,
                    abnormal: false,
                    critical: false
                }))
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
        <Modal isOpen={isOpen} onClose={onClose} title={`Test Result Entry`} size="xl">
            <div className="space-y-6">
                {loading ? (
                    <div className="py-10 text-center italic text-slate-400 font-bold">Loading test parameters...</div>
                ) : parameters.length === 0 ? (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex flex-col gap-2">
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
                    <Button onClick={handleSave} isLoading={saving} disabled={loading || parameters.length === 0}>Complete & Save</Button>
                </div>
            </div>
        </Modal>
    );
};

export default LabResultEntryModal;
