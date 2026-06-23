'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { labApi, HospitalLabTestConfigDTO, HospitalLabPackageConfigDTO } from '@/modules/lab/api/labApi';

type MainTab = 'tests' | 'packages';
type StatusTab = 'all' | 'active' | 'inactive';

// ── Validation helpers ────────────────────────────────────────
const isTestConfigured = (t: HospitalLabTestConfigDTO) =>
    (t.standardPrice ?? 0) > 0 &&
    (t.emergencyPrice ?? 0) > 0 &&
    (t.tatValue ?? 0) > 0;

const isPkgConfigured = (p: HospitalLabPackageConfigDTO) =>
    (p.standardPrice ?? 0) > 0 &&
    (p.emergencyPrice ?? 0) > 0;

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ checked, onChange, loading, locked }: {
    checked: boolean;
    onChange: () => void;
    loading?: boolean;
    locked?: boolean;    // true = not yet configured, blocks enable
}) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={loading}
            title={locked ? 'Set pricing & TAT before enabling' : undefined}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                checked ? 'bg-emerald-500'
                : locked ? 'bg-amber-300'
                : 'bg-slate-300'
            } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-4' : 'translate-x-1'
            }`} />
        </button>
    );
}

const fmt = (v?: number) => v ? `₹ ${Number(v).toLocaleString('en-IN')}` : '—';

const HospitalLabSettingsPage = () => {
    // ── tabs ──────────────────────────────────────────────────
    const [mainTab, setMainTab] = useState<MainTab>('tests');
    const [statusTab, setStatusTab] = useState<StatusTab>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    // ── tests ─────────────────────────────────────────────────
    const [tests, setTests] = useState<HospitalLabTestConfigDTO[]>([]);
    const [testsLoading, setTestsLoading] = useState(true);
    const [togglingTest, setTogglingTest] = useState<string | null>(null);
    const [editingTest, setEditingTest] = useState<HospitalLabTestConfigDTO | null>(null);
    const [isSavingTest, setIsSavingTest] = useState(false);

    // ── packages ──────────────────────────────────────────────
    const [packages, setPackages] = useState<HospitalLabPackageConfigDTO[]>([]);
    const [pkgsLoading, setPkgsLoading] = useState(false);
    const [togglingPkg, setTogglingPkg] = useState<string | null>(null);
    const [editingPkg, setEditingPkg] = useState<HospitalLabPackageConfigDTO | null>(null);
    const [isSavingPkg, setIsSavingPkg] = useState(false);

    // ── fetch ─────────────────────────────────────────────────
    const fetchTests = useCallback(async () => {
        setTestsLoading(true);
        try {
            const res = await labApi.getAdminTests();
            if (res.success && res.data) setTests(res.data);
        } catch { triggerGlobalToast('Failed to load tests', 'error'); }
        finally { setTestsLoading(false); }
    }, []);

    const fetchPackages = useCallback(async () => {
        setPkgsLoading(true);
        try {
            const res = await labApi.getAdminPackages();
            if (res.success && res.data) setPackages(res.data);
        } catch { triggerGlobalToast('Failed to load packages', 'error'); }
        finally { setPkgsLoading(false); }
    }, []);

    useEffect(() => { void fetchTests(); }, [fetchTests]);
    useEffect(() => {
        if (mainTab === 'packages' && packages.length === 0) void fetchPackages();
    }, [mainTab, packages.length, fetchPackages]);

    // reset page on filter change
    useEffect(() => { setPage(0); }, [mainTab, statusTab, search]);

    // ── toggle test ───────────────────────────────────────────
    const handleToggleTest = async (t: HospitalLabTestConfigDTO) => {
        // Trying to enable → must have pricing + TAT configured first
        if (!t.enabled && !isTestConfigured(t)) {
            triggerGlobalToast('Set standard price, emergency price & TAT before enabling', 'error');
            setEditingTest({ ...t });   // open Configure modal directly
            return;
        }
        setTogglingTest(t.testId);
        try {
            const res = await labApi.configureAdminTest({ ...t, enabled: !t.enabled });
            if (res.success) {
                setTests(prev => prev.map(x => x.testId === t.testId ? { ...x, enabled: !x.enabled } : x));
                triggerGlobalToast(`Test ${t.enabled ? 'disabled' : 'enabled'}`, 'success');
            }
        } finally { setTogglingTest(null); }
    };

    // ── toggle package ────────────────────────────────────────
    const handleTogglePkg = async (p: HospitalLabPackageConfigDTO) => {
        // Trying to enable → must have pricing configured first
        if (!p.enabled && !isPkgConfigured(p)) {
            triggerGlobalToast('Set standard price & emergency price before enabling', 'error');
            setEditingPkg({ ...p });    // open Configure modal directly
            return;
        }
        setTogglingPkg(p.packageId);
        try {
            const res = await labApi.configureAdminPackage({ ...p, enabled: !p.enabled });
            if (res.success) {
                setPackages(prev => prev.map(x => x.packageId === p.packageId ? { ...x, enabled: !x.enabled } : x));
                triggerGlobalToast(`Package ${p.enabled ? 'disabled' : 'enabled'}`, 'success');
            }
        } finally { setTogglingPkg(null); }
    };

    // ── save test config ──────────────────────────────────────
    const handleSaveTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTest) return;

        // Block enabling if pricing / TAT not filled
        if (editingTest.enabled && !isTestConfigured(editingTest)) {
            triggerGlobalToast('Fill standard price, emergency price & TAT to enable this test', 'error');
            return;
        }

        setIsSavingTest(true);
        try {
            const res = await labApi.configureAdminTest(editingTest);
            if (res.success) {
                setTests(prev => prev.map(x => x.testId === editingTest.testId ? { ...editingTest } : x));
                triggerGlobalToast('Test configured', 'success');
                setEditingTest(null);
            }
        } finally { setIsSavingTest(false); }
    };

    // ── save package config ───────────────────────────────────
    const handleSavePkg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPkg) return;

        // Block enabling if pricing not filled
        if (editingPkg.enabled && !isPkgConfigured(editingPkg)) {
            triggerGlobalToast('Fill standard price & emergency price to enable this package', 'error');
            return;
        }

        setIsSavingPkg(true);
        try {
            const res = await labApi.configureAdminPackage(editingPkg);
            if (res.success) {
                setPackages(prev => prev.map(x => x.packageId === editingPkg.packageId ? { ...editingPkg } : x));
                triggerGlobalToast('Package configured', 'success');
                setEditingPkg(null);
            }
        } finally { setIsSavingPkg(false); }
    };

    // ── filtered + paginated ──────────────────────────────────
    const filteredTests = useMemo(() => tests.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.testName.toLowerCase().includes(q) || t.testCode.toLowerCase().includes(q);
        const matchStatus = statusTab === 'all' ? true : statusTab === 'active' ? t.enabled : !t.enabled;
        return matchSearch && matchStatus;
    }), [tests, search, statusTab]);

    const filteredPkgs = useMemo(() => packages.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !q || p.packageName.toLowerCase().includes(q) || p.packageCode.toLowerCase().includes(q);
        const matchStatus = statusTab === 'all' ? true : statusTab === 'active' ? p.enabled : !p.enabled;
        return matchSearch && matchStatus;
    }), [packages, search, statusTab]);

    const pagedTests = useMemo(() =>
        filteredTests.slice(page * pageSize, (page + 1) * pageSize),
        [filteredTests, page, pageSize]
    );
    const pagedPkgs = useMemo(() =>
        filteredPkgs.slice(page * pageSize, (page + 1) * pageSize),
        [filteredPkgs, page, pageSize]
    );

    const testCounts = { all: tests.length, active: tests.filter(t => t.enabled).length, inactive: tests.filter(t => !t.enabled).length };
    const pkgCounts  = { all: packages.length, active: packages.filter(p => p.enabled).length, inactive: packages.filter(p => !p.enabled).length };
    const counts = mainTab === 'tests' ? testCounts : pkgCounts;
    const totalFiltered = mainTab === 'tests' ? filteredTests.length : filteredPkgs.length;

    // ── test columns ──────────────────────────────────────────
    const testColumns: Column<HospitalLabTestConfigDTO>[] = [
        {
            header: 'Code',
            render: t => (
                <span className="text-[10px] font-black uppercase font-mono tracking-widest bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                    {t.testCode}
                </span>
            ),
            width: '90px',
        },
        {
            header: 'Test Name',
            render: t => <span className="text-sm font-bold text-slate-800">{t.testName}</span>,
        },
        {
            header: 'Department',
            render: t => <span className="text-xs font-bold text-slate-500">{t.departmentName || '—'}</span>,
        },
        {
            header: 'Status',
            render: t => (
                <div className="flex items-center gap-1.5">
                    <Badge variant={t.enabled ? 'emerald' : 'slate'} size="sm">
                        {t.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {!t.enabled && !isTestConfigured(t) && (
                        <span
                            title="Pricing & TAT not configured — cannot enable"
                            className="material-symbols-outlined text-amber-500 text-sm"
                        >
                            warning
                        </span>
                    )}
                </div>
            ),
            width: '120px',
        },
        {
            header: 'Standard',
            render: t => (
                <span className={`text-sm font-black ${(t.standardPrice ?? 0) > 0 ? 'text-slate-700' : 'text-red-400'}`}>
                    {fmt(t.standardPrice)}
                </span>
            ),
            width: '100px',
        },
        {
            header: 'Emergency',
            render: t => (
                <span className={`text-sm font-black ${(t.emergencyPrice ?? 0) > 0 ? 'text-orange-600' : 'text-red-400'}`}>
                    {fmt(t.emergencyPrice)}
                </span>
            ),
            width: '100px',
        },
        {
            header: 'TAT',
            render: t => (
                <span className={`text-xs font-bold ${(t.tatValue ?? 0) > 0 ? 'text-slate-500' : 'text-red-400'}`}>
                    {t.tatValue ? `${t.tatValue} ${t.tatUnit}` : 'Not set'}
                </span>
            ),
            width: '90px',
        },
        {
            header: 'Active',
            headerClassName: 'text-center',
            className: 'text-center',
            render: t => (
                <Toggle
                    checked={t.enabled}
                    onChange={() => void handleToggleTest(t)}
                    loading={togglingTest === t.testId}
                    locked={!t.enabled && !isTestConfigured(t)}
                />
            ),
            width: '70px',
        },
        {
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            render: t => (
                <Button variant="secondary" size="sm" onClick={() => setEditingTest({ ...t })}>
                    Configure
                </Button>
            ),
            width: '110px',
        },
    ];

    // ── package columns ───────────────────────────────────────
    const pkgColumns: Column<HospitalLabPackageConfigDTO>[] = [
        {
            header: 'Code',
            render: p => (
                <span className="text-[10px] font-black uppercase font-mono tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {p.packageCode}
                </span>
            ),
            width: '100px',
        },
        {
            header: 'Package Name',
            render: p => (
                <div>
                    <p className="text-sm font-bold text-slate-800">{p.packageName}</p>
                    {p.description && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{p.description}</p>}
                </div>
            ),
        },
        {
            header: 'Type',
            render: p => p.packageType
                ? <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.packageType}</span>
                : <span className="text-slate-300">—</span>,
            width: '100px',
        },
        {
            header: 'Tests',
            render: p => (
                <span className="text-xs font-bold text-slate-500">{p.testIds?.length ?? 0} tests</span>
            ),
            width: '70px',
        },
        {
            header: 'Status',
            render: p => (
                <div className="flex items-center gap-1.5">
                    <Badge variant={p.enabled ? 'emerald' : 'slate'} size="sm">
                        {p.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {!p.enabled && !isPkgConfigured(p) && (
                        <span
                            title="Pricing not configured — cannot enable"
                            className="material-symbols-outlined text-amber-500 text-sm"
                        >
                            warning
                        </span>
                    )}
                </div>
            ),
            width: '120px',
        },
        {
            header: 'Standard',
            render: p => (
                <span className={`text-sm font-black ${(p.standardPrice ?? 0) > 0 ? 'text-slate-700' : 'text-red-400'}`}>
                    {fmt(p.standardPrice)}
                </span>
            ),
            width: '100px',
        },
        {
            header: 'Emergency',
            render: p => (
                <span className={`text-sm font-black ${(p.emergencyPrice ?? 0) > 0 ? 'text-orange-600' : 'text-red-400'}`}>
                    {fmt(p.emergencyPrice)}
                </span>
            ),
            width: '100px',
        },
        {
            header: 'Active',
            headerClassName: 'text-center',
            className: 'text-center',
            render: p => (
                <Toggle
                    checked={p.enabled}
                    onChange={() => void handleTogglePkg(p)}
                    loading={togglingPkg === p.packageId}
                    locked={!p.enabled && !isPkgConfigured(p)}
                />
            ),
            width: '70px',
        },
        {
            header: 'Actions',
            headerClassName: 'text-right',
            className: 'text-right',
            render: p => (
                <Button variant="secondary" size="sm" onClick={() => setEditingPkg({ ...p })}>
                    Configure
                </Button>
            ),
            width: '110px',
        },
    ];

    return (
        <MainLayout title="Hospital Lab Settings">
            <PageSurface maxWidthClassName="max-w-[1400px]" backgroundClassName="bg-white">
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Hospital Lab Settings"
                        description="Enable tests & packages for this hospital and configure pricing and turn-around times."
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                                {testCounts.active} tests active
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                                {pkgCounts.active} packages active
                            </span>
                        </div>
                    </PageHeading>

                    {/* ── Main tabs ──────────────────────────── */}
                    <div className="flex gap-1 border-b border-slate-200">
                        {([
                            ['tests', 'experiment', 'Atomic Tests'],
                            ['packages', 'category', 'Panels & Packages'],
                        ] as const).map(([key, icon, label]) => (
                            <button
                                key={key}
                                onClick={() => { setMainTab(key); setStatusTab('all'); setSearch(''); }}
                                className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors -mb-px ${
                                    mainTab === key
                                        ? 'border-orange-500 text-orange-700'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                                {label}
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 ${
                                    mainTab === key ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {key === 'tests' ? testCounts.all : pkgCounts.all}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ── Search + status filter bar ─────────── */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                        <div className="flex items-center flex-1 bg-white border border-slate-200 rounded-xl px-4 shadow-sm focus-within:border-orange-500 transition-all">
                            <span className="material-symbols-outlined text-slate-400 mr-2 text-sm">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={mainTab === 'tests' ? 'Search by test name or code...' : 'Search by package name or code...'}
                                className="h-10 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-300"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            )}
                        </div>

                        {/* status pills */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {(['all', 'active', 'inactive'] as StatusTab[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusTab(s)}
                                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                                        statusTab === s
                                            ? s === 'active' ? 'bg-emerald-600 text-white'
                                            : s === 'inactive' ? 'bg-slate-600 text-white'
                                            : 'bg-orange-700 text-white'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {s} <span className="ml-1 opacity-75">{counts[s]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Table ─────────────────────────────── */}
                    <div className="min-h-[400px]">
                        {mainTab === 'tests' && (
                            <Table
                                columns={testColumns}
                                data={pagedTests}
                                isLoading={testsLoading}
                                emptyMessage="No tests found."
                            />
                        )}
                        {mainTab === 'packages' && (
                            <Table
                                columns={pkgColumns}
                                data={pagedPkgs}
                                isLoading={pkgsLoading}
                                emptyMessage="No packages found."
                            />
                        )}
                    </div>

                    {/* ── Pagination ────────────────────────── */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            {mainTab === 'tests' ? 'Lab Test Configuration' : 'Lab Package Configuration'}
                        </p>
                        <Pagination
                            page={page}
                            totalElements={totalFiltered}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
                            label={mainTab === 'tests' ? 'tests' : 'packages'}
                        />
                    </div>
                </div>
            </PageSurface>

            {/* ── Test Configure Modal ──────────────────────────── */}
            <Modal isOpen={!!editingTest} onClose={() => setEditingTest(null)} title={editingTest ? `Configure — ${editingTest.testName}` : ''} size="lg">
                {editingTest && (
                    <form onSubmit={e => void handleSaveTest(e)} className="p-6 space-y-5">
                        {(() => {
                            const configured = isTestConfigured(editingTest);
                            const canEnable = configured || editingTest.enabled;
                            return (
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                                    canEnable ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Enable for this hospital</p>
                                        {canEnable ? (
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                Doctors can prescribe this test only when enabled
                                            </p>
                                        ) : (
                                            <p className="text-xs text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">lock</span>
                                                Fill standard price, emergency price &amp; TAT to unlock
                                            </p>
                                        )}
                                    </div>
                                    <Toggle
                                        checked={editingTest.enabled}
                                        onChange={() => {
                                            if (!editingTest.enabled && !configured) {
                                                triggerGlobalToast('Fill pricing & TAT fields below first', 'error');
                                                return;
                                            }
                                            setEditingTest({ ...editingTest, enabled: !editingTest.enabled });
                                        }}
                                        locked={!canEnable}
                                    />
                                </div>
                            );
                        })()}
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Pricing</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Standard Price (₹)</label>
                                    <input type="number" step="0.01" min="0"
                                        value={editingTest.standardPrice ?? ''}
                                        onChange={e => setEditingTest({ ...editingTest, standardPrice: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        placeholder="e.g. 500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Emergency Price (₹)</label>
                                    <input type="number" step="0.01" min="0"
                                        value={editingTest.emergencyPrice ?? ''}
                                        onChange={e => setEditingTest({ ...editingTest, emergencyPrice: Number(e.target.value) })}
                                        className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-black text-orange-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        placeholder="e.g. 800" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Turn-Around Time (TAT)</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Value</label>
                                    <input type="number" min="0"
                                        value={editingTest.tatValue ?? ''}
                                        onChange={e => setEditingTest({ ...editingTest, tatValue: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        placeholder="e.g. 24" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Unit</label>
                                    <select value={editingTest.tatUnit ?? 'Hours'}
                                        onChange={e => setEditingTest({ ...editingTest, tatUnit: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10">
                                        <option value="Minutes">Minutes</option>
                                        <option value="Hours">Hours</option>
                                        <option value="Days">Days</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="secondary" onClick={() => setEditingTest(null)} disabled={isSavingTest}>Cancel</Button>
                            <Button type="submit" isLoading={isSavingTest} className="bg-orange-700 hover:bg-orange-800">Save Configuration</Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ── Package Configure Modal ───────────────────────── */}
            <Modal isOpen={!!editingPkg} onClose={() => setEditingPkg(null)} title={editingPkg ? `Configure — ${editingPkg.packageName}` : ''} size="md">
                {editingPkg && (
                    <form onSubmit={e => void handleSavePkg(e)} className="p-6 space-y-5">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <span className="text-[9px] font-black uppercase font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{editingPkg.packageCode}</span>
                            {editingPkg.packageType && <span className="text-[9px] font-black uppercase text-blue-500">{editingPkg.packageType}</span>}
                            {editingPkg.testIds?.length > 0 && (
                                <span className="text-[9px] font-bold text-blue-400 ml-auto">{editingPkg.testIds.length} component tests</span>
                            )}
                        </div>
                        {(() => {
                            const configured = isPkgConfigured(editingPkg);
                            const canEnable = configured || editingPkg.enabled;
                            return (
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                                    canEnable ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Enable for this hospital</p>
                                        {canEnable ? (
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                Doctors can order this package only when enabled
                                            </p>
                                        ) : (
                                            <p className="text-xs text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">lock</span>
                                                Fill standard price &amp; emergency price to unlock
                                            </p>
                                        )}
                                    </div>
                                    <Toggle
                                        checked={editingPkg.enabled}
                                        onChange={() => {
                                            if (!editingPkg.enabled && !configured) {
                                                triggerGlobalToast('Fill pricing fields below first', 'error');
                                                return;
                                            }
                                            setEditingPkg({ ...editingPkg, enabled: !editingPkg.enabled });
                                        }}
                                        locked={!canEnable}
                                    />
                                </div>
                            );
                        })()}
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Pricing</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Standard Price (₹)</label>
                                    <input type="number" step="0.01" min="0"
                                        value={editingPkg.standardPrice ?? ''}
                                        onChange={e => setEditingPkg({ ...editingPkg, standardPrice: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        placeholder="e.g. 1200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Emergency Price (₹)</label>
                                    <input type="number" step="0.01" min="0"
                                        value={editingPkg.emergencyPrice ?? ''}
                                        onChange={e => setEditingPkg({ ...editingPkg, emergencyPrice: Number(e.target.value) })}
                                        className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-black text-orange-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                        placeholder="e.g. 1500" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="secondary" onClick={() => setEditingPkg(null)} disabled={isSavingPkg}>Cancel</Button>
                            <Button type="submit" isLoading={isSavingPkg} className="bg-blue-700 hover:bg-blue-800">Save Configuration</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </MainLayout>
    );
};

export default HospitalLabSettingsPage;
