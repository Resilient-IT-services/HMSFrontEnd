'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { labApi, LabTestDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';

export function LabPricingPage() {
    const [tests, setTests] = useState<LabTestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedParam] = useState<LabTestDTO | null>(null);
    const [showModal, setShowModal] = useState(false);
    
    const [pricingData, setPricingData] = useState<any>({
        standardPrice: 0,
        emergencyPrice: 0,
        insurancePrice: 0,
        effectiveFrom: new Date().toISOString().split('T')[0]
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await labApi.getTests();
            if (res.success && res.data) setTests(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchData();
        });
    }, [fetchData]);

    const handleOpenEdit = async (test: LabTestDTO) => {
        setSelectedParam(test);
        try {
            const res = await labApi.getPricingByTest(test.id!);
            if (res.success && res.data) {
                setPricingData({
                    ...res.data,
                    effectiveFrom: res.data.effectiveFrom || new Date().toISOString().split('T')[0]
                });
            } else {
                setPricingData({
                    testId: test.id,
                    standardPrice: 0,
                    emergencyPrice: 0,
                    insurancePrice: 0,
                    effectiveFrom: new Date().toISOString().split('T')[0]
                });
            }
            setShowModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await labApi.savePricing(pricingData);
            if (res.success) {
                triggerGlobalToast('Pricing updated successfully', 'success');
                setShowModal(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <MainLayout title="Lab Pricing Management">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lab Pricing</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage tiered pricing (Standard, Emergency, Insurance) for all tests.</p>
                    </div>
                </div>

                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Test Code</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Test Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : tests.length === 0 ? (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400">No tests found.</td></tr>
                            ) : (
                                tests.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-700 uppercase tracking-wider text-xs">{test.testCode}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{test.testName}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                icon="payments"
                                                onClick={() => handleOpenEdit(test)}
                                                className="h-8 p-1 text-[10px] font-black uppercase tracking-tighter"
                                            >
                                                Set Price
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Pricing: ${selectedTest?.testName}`} size="lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Standard Price (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={pricingData.standardPrice} 
                                onChange={e => setPricingData({...pricingData, standardPrice: Number(e.target.value)})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Emergency Price (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={pricingData.emergencyPrice} 
                                onChange={e => setPricingData({...pricingData, emergencyPrice: Number(e.target.value)})} 
                                className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all text-orange-700" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Insurance Price (₹)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={pricingData.insurancePrice} 
                                onChange={e => setPricingData({...pricingData, insurancePrice: Number(e.target.value)})} 
                                className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-green-700" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">Effective From</label>
                            <input 
                                type="date" 
                                value={pricingData.effectiveFrom} 
                                onChange={e => setPricingData({...pricingData, effectiveFrom: e.target.value})} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-slate-500/10 transition-all" 
                                required 
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-100 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-slate-400 mt-0.5">info</span>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Automated Taxation</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-tight">
                                Tax (GST) will be calculated automatically based on the HSN/SAC code defined in the Test Master and the hospital's local GST rules.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-orange-700 hover:bg-orange-800">Save Pricing</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
