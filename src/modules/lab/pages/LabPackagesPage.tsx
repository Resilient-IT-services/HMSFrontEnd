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
import { labApi, LabPackageDTO, LabTestDTO, PackageType, PACKAGE_TYPE_LABELS } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

const PACKAGE_TYPE_VARIANTS: Record<PackageType, any> = {
    PROFILE: 'blue',
    PANEL: 'indigo',
    SCREENING: 'orange',
    HEALTH_CHECKUP: 'emerald',
    CUSTOM: 'slate',
};

const LabPackagesPage = () => {
    const [packages, setPackages] = useState<LabPackageDTO[]>([]);
    const [tests, setTests] = useState<LabTestDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [testSearch, setTestSearch] = useState('');
    const [formData, setFormData] = useState<LabPackageDTO>({
        packageCode: '',
        packageName: '',
        description: '',
        active: true,
        packageType: 'PANEL',
        isBillable: true,
        testIds: [],
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pkgRes, testRes] = await Promise.all([labApi.getPackages(), labApi.getTests()]);
            if (pkgRes.success && pkgRes.data) setPackages(pkgRes.data);
            if (testRes.success && testRes.data) setTests(testRes.data);
        } catch {
            triggerGlobalToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    const handleOpenAdd = () => {
        setEditingId(null);
        setTestSearch('');
        setFormData({ packageCode: '', packageName: '', description: '', active: true, packageType: 'PANEL', isBillable: true, testIds: [] });
        setShowModal(true);
    };

    const handleOpenEdit = (pkg: LabPackageDTO) => {
        setEditingId(pkg.id!);
        setTestSearch('');
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
                void fetchData();
            }
        } catch {
            triggerGlobalToast('Failed to save package', 'error');
        }
    };

    const handleDelete = async (pkg: LabPackageDTO) => {
        if (!confirm(`Archive package "${pkg.packageName}"? It will no longer appear in new orders.`)) return;
        try {
            await labApi.deletePackage(pkg.id!);
            triggerGlobalToast('Package archived', 'success');
            void fetchData();
        } catch {
            triggerGlobalToast('Failed to archive package', 'error');
        }
    };

    const toggleTest = (testId: string) => {
        setFormData(prev => ({
            ...prev,
            testIds: prev.testIds.includes(testId)
                ? prev.testIds.filter(id => id !== testId)
                : [...prev.testIds, testId],
        }));
    };

    const getTestName = (testId: string) => tests.find(t => t.id === testId)?.testName ?? testId;

    const filteredTests = tests.filter(t =>
        t.testName.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.testCode.toLowerCase().includes(testSearch.toLowerCase())
    );

    const columns: Column<LabPackageDTO>[] = [
        {
            header: 'Code',
            render: (item) => (
                <div>
                    <span className="text-xs font-black text-slate-700 uppercase">{item.packageCode}</span>
                    {item.versionNo && item.versionNo > 1 && (
                        <span className="ml-2 text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            v{item.versionNo}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Package Name',
            render: (item) => (
                <div>
                    <p className="text-sm font-bold text-slate-800">{item.packageName}</p>
                    {item.description && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">{item.description}</p>
                    )}
                </div>
            ),
        },
        {
            header: 'Type',
            render: (item) => item.packageType ? (
                <Badge variant={PACKAGE_TYPE_VARIANTS[item.packageType] ?? 'slate'} size="sm">
                    {PACKAGE_TYPE_LABELS[item.packageType]}
                </Badge>
            ) : <span className="text-xs text-slate-400">—</span>,
        },
        {
            header: 'Tests',
            render: (item) => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {item.testIds.slice(0, 3).map(id => (
                        <span key={id} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {getTestName(id)}
                        </span>
                    ))}
                    {item.testIds.length > 3 && (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                            +{item.testIds.length - 3} more
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Status',
            render: (item) => (
                <Badge variant={item.active ? 'emerald' : 'slate'} size="sm">
                    {item.active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (item) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => handleOpenEdit(item)}>
                        Edit
                    </Button>
                    <Button size="sm" variant="ghost" icon="archive" onClick={() => handleDelete(item)}>
                        Archive
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <MainLayout title="Lab Packages Management">
            <PageSurface>
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Health Packages"
                        description="Combine multiple tests into panels, profiles, and health checkup packages."
                    />

                    <ContentPanel>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                Available Packages
                            </h3>
                            <Button size="sm" icon="add" onClick={handleOpenAdd}>
                                Create New Package
                            </Button>
                        </div>
                        <Table columns={columns} data={packages} isLoading={loading} />
                    </ContentPanel>
                </div>
            </PageSurface>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Package' : 'Create Package'}
                size="xl"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Row 1: Code + Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                                Package Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={formData.packageCode}
                                onChange={(e) => setFormData({ ...formData, packageCode: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                placeholder="e.g. CBC"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                                Package Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={formData.packageName}
                                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                placeholder="e.g. Complete Blood Count"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Type + Billable */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                                Package Type
                            </label>
                            <select
                                value={formData.packageType ?? 'PANEL'}
                                onChange={(e) => setFormData({ ...formData, packageType: e.target.value as PackageType })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            >
                                {(Object.keys(PACKAGE_TYPE_LABELS) as PackageType[]).map(type => (
                                    <option key={type} value={type}>{PACKAGE_TYPE_LABELS[type]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col justify-center pt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isBillable ?? true}
                                    onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <div>
                                    <p className="text-sm font-black text-slate-700">Billable Package</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Charge patient separately for this package</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Row 3: Description */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                            Description
                        </label>
                        <textarea
                            value={formData.description ?? ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                            placeholder="Brief description of what this package screens for..."
                        />
                    </div>

                    {/* Row 4: Test selector */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                Select Tests
                            </label>
                            <span className="text-[10px] font-black text-primary">
                                {formData.testIds.length} selected
                            </span>
                        </div>

                        {/* Selected tests chips */}
                        {formData.testIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                                {formData.testIds.map(id => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => toggleTest(id)}
                                        className="flex items-center gap-1 bg-white text-xs font-bold text-slate-700 border border-slate-200 rounded-full px-3 py-1 hover:border-red-300 hover:text-red-500 transition-all"
                                    >
                                        {getTestName(id)}
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative mb-2">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
                            <input
                                type="text"
                                value={testSearch}
                                onChange={(e) => setTestSearch(e.target.value)}
                                placeholder="Search tests by name or code..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-primary transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                            {filteredTests.map(test => {
                                const selected = formData.testIds.includes(test.id!);
                                return (
                                    <div
                                        key={test.id}
                                        onClick={() => toggleTest(test.id!)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                                            selected
                                                ? 'bg-primary/5 border-primary'
                                                : 'bg-white border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-sm ${selected ? 'text-primary' : 'text-slate-300'}`}>
                                            {selected ? 'check_box' : 'check_box_outline_blank'}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 leading-tight">{test.testName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{test.testCode}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredTests.length === 0 && (
                                <div className="col-span-2 py-6 text-center text-xs text-slate-400 font-bold">
                                    No tests match your search
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold text-slate-600">Active (available for ordering)</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingId ? 'Update Package' : 'Create Package'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default LabPackagesPage;
