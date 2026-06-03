'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { labApi } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LabResultEntryModal } from '../components/LabResultEntryModal';

export const LabQueuePage = () => {
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTest, setSelectedTest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await labApi.getQueue();
            if (res.success && res.data) {
                setQueue(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch lab queue:', error);
            triggerGlobalToast('Failed to load queue', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessTest = (order: any, test: any) => {
        setSelectedTest({
            id: test.id,
            testId: test.testId,
            testName: test.testName,
            testCode: test.testCode,
            patientName: order.patientName
        });
        setIsModalOpen(true);
    };

    useEffect(() => {
        void fetchQueue();
    }, []);

    return (
        <MainLayout title="Laboratory Queue">
            <PageSurface backgroundClassName="bg-slate-50">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Patient Test Queue</h2>
                            <p className="text-sm text-slate-500 font-medium">Manage pending investigations and sample collections</p>
                        </div>
                        <Button onClick={fetchQueue} icon="refresh" variant="secondary" className="font-black text-xs h-10">Refresh Queue</Button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center italic text-slate-400 font-bold">Loading queue...</div>
                    ) : queue.length === 0 ? (
                        <Card className="py-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">clinical_notes</span>
                            <p className="text-slate-400 font-bold">No pending lab orders found for this hospital.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {queue.map((order) => (
                                <Card key={order.id} className="p-0 overflow-hidden border-slate-200 hover:border-orange-200 transition-all group">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-orange-600">person</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-slate-900 leading-none">{order.patientName}</h3>
                                                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest">{order.orderNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-tight">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span>{new Date(order.orderedAt).toLocaleString()}</span>
                                                    <span>•</span>
                                                    <span className="text-orange-600 font-black">{order.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 border-t border-slate-100 p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {order.tests?.map((test: any) => (
                                                <div key={test.id} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm group/test">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${test.status === 'PENDING' ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                    <span className="text-[10px] font-black text-slate-700">{test.testName}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1 rounded uppercase tracking-widest">{test.testCode}</span>
                                                    {test.status === 'PENDING' && (
                                                        <button 
                                                            onClick={() => handleProcessTest(order, test)}
                                                            className="ml-2 bg-orange-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded hover:bg-orange-700 transition-colors"
                                                        >
                                                            Enter Results
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {selectedTest && (
                    <LabResultEntryModal 
                        isOpen={isModalOpen}
                        onClose={() => { setIsModalOpen(false); setSelectedTest(null); }}
                        onSuccess={fetchQueue}
                        orderTest={selectedTest}
                    />
                )}
            </PageSurface>
        </MainLayout>
    );
};
