'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { labApi, LabMachineDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

const LabMachinesPage = () => {
    const [machines, setMachines] = useState<LabMachineDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<LabMachineDTO>({
        machineCode: '',
        machineName: '',
        manufacturer: '',
        serialNumber: ''
    });

    const fetchMachines = useCallback(async () => {
        try {
            setLoading(true);
            const res = await labApi.getMachines();
            if (res.success && res.data) {
                setMachines(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch machines:', error);
            triggerGlobalToast('Failed to load machines', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchMachines();
        };
        init();
    }, [fetchMachines]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ machineCode: '', machineName: '', manufacturer: '', serialNumber: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (machine: LabMachineDTO) => {
        setEditingId(machine.id!);
        setFormData({ ...machine });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingId 
                ? await labApi.updateMachine(editingId, formData)
                : await labApi.createMachine(formData);
            if (res.success) {
                triggerGlobalToast(`Machine ${editingId ? 'updated' : 'created'} successfully`, 'success');
                setShowModal(false);
                fetchMachines();
            }
        } catch (error) {
            console.error('Failed to save machine:', error);
        }
    };

    const columns: Column<LabMachineDTO>[] = [
        {
            header: 'Machine Code',
            render: (item) => <span className="text-xs font-black text-slate-700 uppercase">{item.machineCode}</span>
        },
        {
            header: 'Machine Name',
            render: (item) => <span className="text-sm font-bold text-slate-800">{item.machineName}</span>
        },
        {
            header: 'Manufacturer',
            render: (item) => <span className="text-sm text-slate-600">{item.manufacturer}</span>
        },
        {
            header: 'Serial Number',
            render: (item) => <span className="text-xs font-mono text-slate-500">{item.serialNumber}</span>
        },
        {
            header: 'Action',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (item) => (
                <Button size="sm" variant="ghost" icon="edit" onClick={() => handleOpenEdit(item)}>
                    Edit
                </Button>
            )
        }
    ];

    return (
        <MainLayout title="Lab Machines Management">
            <PageSurface>
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Laboratory Equipment"
                        description="Manage and track lab machines and analyzers."
                    />

                    <ContentPanel>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registered Machines</h3>
                            <Button size="sm" icon="add" onClick={handleOpenAdd}>Register Machine</Button>
                        </div>
                        <Table
                            columns={columns}
                            data={machines}
                            isLoading={loading}
                        />
                    </ContentPanel>
                </div>
            </PageSurface>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Machine" : "Register Machine"} size="lg">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Machine Code</label>
                            <input 
                                value={formData.machineCode} 
                                onChange={(e) => setFormData({ ...formData, machineCode: e.target.value.toUpperCase() })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. BC-5000" 
                                required 
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Machine Name</label>
                            <input 
                                value={formData.machineName} 
                                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. Hematology Analyzer" 
                                required 
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Manufacturer</label>
                            <input 
                                value={formData.manufacturer} 
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. Mindray" 
                                required 
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Serial Number</label>
                            <input 
                                value={formData.serialNumber} 
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. SN-12345678" 
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Save Machine</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default LabMachinesPage;
