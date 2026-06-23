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
import { labApi, LabPackageDTO, LabTestDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

const LabPackagesPage = () => {
    const [packages, setPackages] = useState<LabPackageDTO[]>([]);
    const [tests, setTests] = useState<LabTestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<LabPackageDTO>({
        packageCode: '',
        packageName: '',
        active: true,
        testIds: []
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pkgRes, testRes] = await Promise.all([
                labApi.getPackages(),
                labApi.getTests()
            ]);
            if (pkgRes.success && pkgRes.data) setPackages(pkgRes.data);
            if (testRes.success && testRes.data) setTests(testRes.data);
        } catch (error) {
            console.error('Failed to fetch packages:', error);
            triggerGlobalToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchData();
        };
        init();
    }, [fetchData]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ packageCode: '', packageName: '', active: true, testIds: [] });
        setShowModal(true);
    };

    const handleOpenEdit = (pkg: LabPackageDTO) => {
        setEditingId(pkg.id!);
        setFormData({ ...pkg });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingId 
                ? await labApi.updatePackage(editingId, formData)
                : await labApi.createPackage(formData);
            if (res.success) {
                triggerGlobalToast(`Package ${editingId ? 'updated' : 'created'} successfully`, 'success');
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to save package:', error);
        }
    };

    const toggleTest = (testId: string) => {
        setFormData(prev => {
            const testIds = prev.testIds.includes(testId)
                ? prev.testIds.filter(id => id !== testId)
                : [...prev.testIds, testId];
            return { ...prev, testIds };
        });
    };

    const columns: Column<LabPackageDTO>[] = [
        {
            header: 'Package Code',
            render: (item) => <span className="text-xs font-black text-slate-700 uppercase">{item.packageCode}</span>
        },
        {
            header: 'Package Name',
            render: (item) => <span className="text-sm font-bold text-slate-800">{item.packageName}</span>
        },
        {
            header: 'Included Tests',
            render: (item) => (
                <div className="flex flex-wrap gap-1">
                    {item.testIds.length} Tests
                </div>
            )
        },
        {
            header: 'Status',
            render: (item) => (
                <Badge variant={item.active ? 'emerald' : 'slate'} size="sm">
                    {item.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
            )
        },
        {
            header: 'Action',
            className: 'text-center',
            headerClassName: 'text-center',
            render: (item) => (
                <Button size="sm" variant="ghost" icon="edit" onClick={() => handleOpenEdit(item)}>
                    Edit
                </Button>
            )
        }
    ];

    return (
        <MainLayout title="Lab Packages Management">
            <PageSurface>
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Health Packages"
                        description="Combine multiple tests into health checkup packages."
                    />

                    <ContentPanel>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Available Packages</h3>
                            <Button size="sm" icon="add" onClick={handleOpenAdd}>Create New Package</Button>
                        </div>
                        <Table
                            columns={columns}
                            data={packages}
                            isLoading={loading}
                        />
                    </ContentPanel>
                </div>
            </PageSurface>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Package" : "Create Package"} size="xl">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Package Code</label>
                            <input 
                                value={formData.packageCode} 
                                onChange={(e) => setFormData({ ...formData, packageCode: e.target.value.toUpperCase() })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. MHC-BASIC" 
                                required 
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Package Name</label>
                            <input 
                                value={formData.packageName} 
                                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                                placeholder="e.g. Master Health Checkup" 
                                required 
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Select Tests</label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-xl">
                                {tests.map(test => (
                                    <div 
                                        key={test.id} 
                                        onClick={() => toggleTest(test.id!)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                                            formData.testIds.includes(test.id!) 
                                                ? 'bg-primary/5 border-primary' 
                                                : 'bg-white border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-sm ${formData.testIds.includes(test.id!) ? 'text-primary' : 'text-slate-300'}`}>
                                            {formData.testIds.includes(test.id!) ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{test.testName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{test.testCode}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Save Package</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default LabPackagesPage;
