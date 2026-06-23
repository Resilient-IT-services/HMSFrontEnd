'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { labApi, LabTestParameterDTO, LabReferenceRangeDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface Props {
    testId: string;
}

export function LabTestParametersPage({ testId }: Props) {
    const [parameters, setParameters] = useState<LabTestParameterDTO[]>([]);
    const [showParamModal, setShowParamModal] = useState(false);
    const [showRangeModal, setShowRangeModal] = useState(false);
    
    const [selectedParam, setSelectedParam] = useState<LabTestParameterDTO | null>(null);
    const [ranges, setRanges] = useState<LabReferenceRangeDTO[]>([]);

    const [editingParamId, setEditingParamId] = useState<string | null>(null);
    const [paramFormData, setParamFormData] = useState<LabTestParameterDTO>({
        testId,
        parameterName: '',
        unit: '',
        displayOrder: 1
    });

    const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
    const [rangeFormData, setRangeFormData] = useState<LabReferenceRangeDTO>({
        parameterId: '',
        gender: 'ALL',
        minAge: 0,
        maxAge: 120,
        ageUnit: 'YEARS',
        minValue: 0,
        maxValue: 0,
        criticalMin: 0,
        criticalMax: 0
    });

    const fetchParameters = useCallback(async () => {
        try {
            const res = await labApi.getParametersByTest(testId);
            if (res.success && res.data) setParameters(res.data);
        } catch (error) {
            console.error(error);
        }
    }, [testId]);

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchParameters();
        });
    }, [fetchParameters]);

    const handleOpenAddParam = () => {
        setEditingParamId(null);
        setParamFormData({ testId, parameterName: '', unit: '', displayOrder: parameters.length + 1 });
        setShowParamModal(true);
    };

    const handleOpenEditParam = (p: LabTestParameterDTO) => {
        setEditingParamId(p.id!);
        setParamFormData({ ...p });
        setShowParamModal(true);
    };

    const handleParamSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingParamId 
                ? await labApi.updateParameter(editingParamId, paramFormData)
                : await labApi.createParameter(paramFormData);
            if (res.success) {
                triggerGlobalToast('Parameter saved', 'success');
                setShowParamModal(false);
                fetchParameters();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRanges = async (paramId: string) => {
        try {
            const res = await labApi.getRangesByParameter(paramId);
            if (res.success && res.data) setRanges(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSelectParam = (p: LabTestParameterDTO) => {
        setSelectedParam(p);
        fetchRanges(p.id!);
    };

    const handleOpenAddRange = () => {
        if (!selectedParam) return;
        setEditingRangeId(null);
        setRangeFormData({
            parameterId: selectedParam.id!,
            gender: 'ALL',
            minAge: 0,
            maxAge: 120,
            ageUnit: 'YEARS',
            minValue: 0,
            maxValue: 0,
            criticalMin: 0,
            criticalMax: 0
        });
        setShowRangeModal(true);
    };

    const handleRangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingRangeId 
                ? await labApi.updateRange(editingRangeId, rangeFormData)
                : await labApi.createRange(rangeFormData);
            if (res.success) {
                triggerGlobalToast('Range saved', 'success');
                setShowRangeModal(false);
                fetchRanges(selectedParam!.id!);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <MainLayout title="Test Parameters & Ranges">
            <div className="p-6 grid grid-cols-12 gap-6">
                {/* Left: Parameters List */}
                <div className="col-span-12 lg:col-span-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Parameters</h2>
                        <Button size="sm" onClick={handleOpenAddParam} icon="add">Add</Button>
                    </div>
                    <Card className="overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {parameters.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => handleSelectParam(p)}
                                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-all flex justify-between items-center ${selectedParam?.id === p.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                                >
                                    <div>
                                        <p className="font-bold text-slate-800">{p.parameterName}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Unit: {p.unit || 'N/A'}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditParam(p); }} className="text-slate-300 hover:text-orange-600">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>
                            ))}
                            {parameters.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No parameters defined</div>}
                        </div>
                    </Card>
                </div>

                {/* Right: Reference Ranges */}
                <div className="col-span-12 lg:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                            {selectedParam ? `Ranges for ${selectedParam.parameterName}` : 'Select a parameter'}
                        </h2>
                        {selectedParam && <Button size="sm" onClick={handleOpenAddRange} icon="add_circle">Add Range</Button>}
                    </div>
                    
                    {selectedParam ? (
                        <Card className="overflow-hidden">
                            <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Gender</th>
                                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Age</th>
                                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Normal Range</th>
                                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Critical</th>
                                        <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ranges.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{r.gender}</div></td>
                                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{r.minAge}-{r.maxAge} {r.ageUnit}</div></td>
                                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                                                <Badge variant="emerald" className="font-black">{r.minValue} - {r.maxValue}</Badge>
                                            </div></td>
                                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[8px] font-black text-red-400 uppercase">Min: {r.criticalMin}</span>
                                                    <span className="text-[8px] font-black text-red-400 uppercase">Max: {r.criticalMax}</span>
                                                </div>
                                            </div></td>
                                            <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                                                <button onClick={() => { setEditingRangeId(r.id!); setRangeFormData({...r}); setShowRangeModal(true); }} className="text-slate-300 hover:text-orange-600">
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                            </div></td>
                                        </tr>
                                    ))}
                                    {ranges.length === 0 && <tr className="hover:bg-slate-50 transition-colors"><td colSpan={5} className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">No ranges defined</div></td></tr>}
                                </tbody>
                            </table>
                        </Card>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
                            <span className="material-symbols-outlined text-5xl">list_alt</span>
                            <p className="mt-2 font-bold uppercase text-xs">Select a parameter to manage its ranges</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Parameter Modal */}
            <Modal isOpen={showParamModal} onClose={() => setShowParamModal(false)} title="Parameter Details">
                <form onSubmit={handleParamSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Name</label>
                        <input value={paramFormData.parameterName} onChange={e => setParamFormData({...paramFormData, parameterName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Unit</label>
                            <input value={paramFormData.unit || ''} onChange={e => setParamFormData({...paramFormData, unit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" placeholder="e.g. g/dL" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Display Order</label>
                            <input type="number" value={paramFormData.displayOrder} onChange={e => setParamFormData({...paramFormData, displayOrder: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="submit" className="bg-orange-700">Save Parameter</Button>
                    </div>
                </form>
            </Modal>

            {/* Range Modal */}
            <Modal isOpen={showRangeModal} onClose={() => setShowRangeModal(false)} title="Reference Range Details">
                <form onSubmit={handleRangeSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Gender</label>
                            <select value={rangeFormData.gender} onChange={e => setRangeFormData({...rangeFormData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold">
                                <option value="ALL">ALL</option>
                                <option value="MALE">MALE</option>
                                <option value="FEMALE">FEMALE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Age Unit</label>
                            <select value={rangeFormData.ageUnit} onChange={e => setRangeFormData({...rangeFormData, ageUnit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold">
                                <option value="YEARS">YEARS</option>
                                <option value="MONTHS">MONTHS</option>
                                <option value="DAYS">DAYS</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Min Age</label>
                            <input type="number" value={rangeFormData.minAge} onChange={e => setRangeFormData({...rangeFormData, minAge: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Max Age</label>
                            <input type="number" value={rangeFormData.maxAge} onChange={e => setRangeFormData({...rangeFormData, maxAge: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1">Normal Min</label>
                            <input type="number" step="0.01" value={rangeFormData.minValue} onChange={e => setRangeFormData({...rangeFormData, minValue: Number(e.target.value)})} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1">Normal Max</label>
                            <input type="number" step="0.01" value={rangeFormData.maxValue} onChange={e => setRangeFormData({...rangeFormData, maxValue: Number(e.target.value)})} className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-red-600 mb-1">Critical Min</label>
                            <input type="number" step="0.01" value={rangeFormData.criticalMin} onChange={e => setRangeFormData({...rangeFormData, criticalMin: Number(e.target.value)})} className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-red-600 mb-1">Critical Max</label>
                            <input type="number" step="0.01" value={rangeFormData.criticalMax} onChange={e => setRangeFormData({...rangeFormData, criticalMax: Number(e.target.value)})} className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm font-bold" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="submit" className="bg-orange-700">Save Range</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
