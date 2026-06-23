'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
    labApi,
    HospitalLabTestConfigDTO,
    HospitalLabPackageConfigDTO,
} from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

type MainTab = 'tests' | 'packages';
type StatusTab = 'all' | 'active' | 'inactive';

// ── tiny toggle switch ────────────────────────────────────────
function Toggle({ checked, onChange, loading }: { checked: boolean; onChange: () => void; loading?: boolean }) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={loading}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                checked ? 'bg-emerald-500' : 'bg-slate-300'
            } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-4' : 'translate-x-1'
            }`} />
        </button>
    );
}

// ── currency formatter ────────────────────────────────────────
const fmt = (v?: number) =>
    v !== undefined && v !== null
        ? `₹ ${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
        : '—';

export function LabPricingPage() {
    const [mainTab, setMainTab] = useState<MainTab>('tests');
    const [statusTab, setStatusTab] = useState<StatusTab>('all');

    // ── tests state ───────────────────────────────────────────
    const [tests, setTests] = useState<HospitalLabTestConfigDTO[]>([]);
    const [testsLoading, setTestsLoading] = useState(false);
    const [togglingTest, setTogglingTest] = useState<string | null>(null);

    // ── packages state ────────────────────────────────────────
    const [packages, setPackages] = useState<HospitalLabPackageConfigDTO[]>([]);
    const [pkgsLoading, setPkgsLoading] = useState(false);
    const [togglingPkg, setTogglingPkg] = useState<string | null>(null);

    // ── price modal ───────────────────────────────────────────
    type PriceTarget =
        | { type: 'test'; item: HospitalLabTestConfigDTO }
        | { type: 'package'; item: HospitalLabPackageConfigDTO };

    const [priceTarget, setPriceTarget] = useState<PriceTarget | null>(null);
    const [priceForm, setPriceForm] = useState({ standardPrice: 0, emergencyPrice: 0 });
    const [savingPrice, setSavingPrice] = useState(false);

    // ── fetch ─────────────────────────────────────────────────
    const fetchTests = useCallback(async () => {
        setTestsLoading(true);
        try {
            const res = await labApi.getAdminTests();
            if (res.success && res.data) setTests(res.data);
        } finally { setTestsLoading(false); }
    }, []);

    const fetchPackages = useCallback(async () => {
        setPkgsLoading(true);
        try {
            const res = await labApi.getAdminPackages();
            if (res.success && res.data) setPackages(res.data);
        } finally { setPkgsLoading(false); }
    }, []);

    useEffect(() => { void fetchTests(); }, [fetchTests]);

    useEffect(() => {
        if (mainTab === 'packages' && packages.length === 0) void fetchPackages();
    }, [mainTab, packages.length, fetchPackages]);

    // ── toggle test active ────────────────────────────────────
    const toggleTest = async (t: HospitalLabTestConfigDTO) => {
        setTogglingTest(t.testId);
        try {
            const res = await labApi.configureAdminTest({ ...t, enabled: !t.enabled });
            if (res.success) {
                setTests(prev => prev.map(x => x.testId === t.testId ? { ...x, enabled: !x.enabled } : x));
                triggerGlobalToast(`Test ${t.enabled ? 'deactivated' : 'activated'}`, 'success');
            }
        } finally { setTogglingTest(null); }
    };

    // ── toggle package active ─────────────────────────────────
    const togglePkg = async (p: HospitalLabPackageConfigDTO) => {
        setTogglingPkg(p.packageId);
        try {
            const res = await labApi.configureAdminPackage({ ...p, enabled: !p.enabled });
            if (res.success) {
                setPackages(prev => prev.map(x => x.packageId === p.packageId ? { ...x, enabled: !x.enabled } : x));
                triggerGlobalToast(`Package ${p.enabled ? 'deactivated' : 'activated'}`, 'success');
            }
        } finally { setTogglingPkg(null); }
    };

    // ── open price modal ──────────────────────────────────────
    const openPrice = (target: PriceTarget) => {
        setPriceTarget(target);
        if (target.type === 'test') {
            setPriceForm({ standardPrice: target.item.standardPrice ?? 0, emergencyPrice: target.item.emergencyPrice ?? 0 });
        } else {
            setPriceForm({ standardPrice: target.item.standardPrice ?? 0, emergencyPrice: target.item.emergencyPrice ?? 0 });
        }
    };

    // ── save price ────────────────────────────────────────────
    const handlePriceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!priceTarget) return;
        setSavingPrice(true);
        try {
            if (priceTarget.type === 'test') {
                const res = await labApi.configureAdminTest({ ...priceTarget.item, ...priceForm });
                if (res.success) {
                    setTests(prev => prev.map(x =>
                        x.testId === priceTarget.item.testId ? { ...x, ...priceForm } : x
                    ));
                    triggerGlobalToast('Test pricing saved', 'success');
                    setPriceTarget(null);
                }
            } else {
                const res = await labApi.configureAdminPackage({ ...priceTarget.item, ...priceForm });
                if (res.success) {
                    setPackages(prev => prev.map(x =>
                        x.packageId === priceTarget.item.packageId ? { ...x, ...priceForm } : x
                    ));
                    triggerGlobalToast('Package pricing saved', 'success');
                    setPriceTarget(null);
                }
            }
        } finally { setSavingPrice(false); }
    };

    // ── filtered lists ────────────────────────────────────────
    const filteredTests = tests.filter(t =>
        statusTab === 'all' ? true : statusTab === 'active' ? t.enabled : !t.enabled
    );
    const filteredPkgs = packages.filter(p =>
        statusTab === 'all' ? true : statusTab === 'active' ? p.enabled : !p.enabled
    );

    const activeCounts = {
        tests: { all: tests.length, active: tests.filter(t => t.enabled).length, inactive: tests.filter(t => !t.enabled).length },
        packages: { all: packages.length, active: packages.filter(p => p.enabled).length, inactive: packages.filter(p => !p.enabled).length },
    };
    const counts = mainTab === 'tests' ? activeCounts.tests : activeCounts.packages;

    // ── price modal title ─────────────────────────────────────
    const priceModalTitle = priceTarget
        ? priceTarget.type === 'test'
            ? `Set Price — ${priceTarget.item.testName}`
            : `Set Price — ${priceTarget.item.packageName}`
        : '';

    return (
        <MainLayout title="Lab Pricing">
            <div className="flex flex-col h-full">

                {/* ── Page header ──────────────────────────────── */}
                <div className="px-6 pt-6 pb-0">
                    <div className="flex items-start justify-between mb-5">
                        <div>
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Lab Configuration</h1>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                                Activate tests &amp; packages for this hospital and manage their pricing
                            </p>
                        </div>
                        {/* summary chips */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                                {activeCounts.tests.active} tests active
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                                {activeCounts.packages.active} packages active
                            </span>
                        </div>
                    </div>

                    {/* ── Main tabs ─────────────────────────────── */}
                    <div className="flex gap-1 border-b border-slate-200">
                        {([['tests', 'experiment', 'Atomic Tests'], ['packages', 'category', 'Panels & Packages']] as const).map(([key, icon, label]) => (
                            <button
                                key={key}
                                onClick={() => { setMainTab(key); setStatusTab('all'); }}
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
                                    {key === 'tests' ? activeCounts.tests.all : activeCounts.packages.all}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Status tabs + grid ────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">

                    {/* Status filter tabs */}
                    <div className="flex items-center gap-2 mb-5">
                        {(['all', 'active', 'inactive'] as StatusTab[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusTab(s)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                                    statusTab === s
                                        ? s === 'active'
                                            ? 'bg-emerald-600 text-white'
                                            : s === 'inactive'
                                                ? 'bg-slate-600 text-white'
                                                : 'bg-orange-700 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {s}
                                <span className="ml-1.5 opacity-70">
                                    {counts[s]}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ── Tests grid ───────────────────────────── */}
                    {mainTab === 'tests' && (
                        testsLoading ? (
                            <LoadingGrid />
                        ) : filteredTests.length === 0 ? (
                            <EmptyState label={statusTab === 'inactive' ? 'No inactive tests' : 'No tests found'} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredTests.map(t => (
                                    <TestCard
                                        key={t.testId}
                                        test={t}
                                        toggling={togglingTest === t.testId}
                                        onToggle={() => void toggleTest(t)}
                                        onSetPrice={() => openPrice({ type: 'test', item: t })}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/* ── Packages grid ────────────────────────── */}
                    {mainTab === 'packages' && (
                        pkgsLoading ? (
                            <LoadingGrid />
                        ) : filteredPkgs.length === 0 ? (
                            <EmptyState label={statusTab === 'inactive' ? 'No inactive packages' : 'No packages configured'} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredPkgs.map(p => (
                                    <PackageCard
                                        key={p.packageId}
                                        pkg={p}
                                        toggling={togglingPkg === p.packageId}
                                        onToggle={() => void togglePkg(p)}
                                        onSetPrice={() => openPrice({ type: 'package', item: p })}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* ── Price Modal ───────────────────────────────────── */}
            <Modal isOpen={!!priceTarget} onClose={() => setPriceTarget(null)} title={priceModalTitle} size="md">
                <form onSubmit={e => void handlePriceSave(e)} className="p-6 space-y-4">
                    {/* Test identifier chip */}
                    {priceTarget && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded font-mono ${
                                priceTarget.type === 'test' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {priceTarget.type === 'test' ? priceTarget.item.testCode : priceTarget.item.packageCode}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                                {priceTarget.type === 'test' ? priceTarget.item.departmentName : priceTarget.item.packageType}
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                            Standard Price (₹)
                        </label>
                        <input
                            type="number" step="0.01" min="0"
                            value={priceForm.standardPrice}
                            onChange={e => setPriceForm(f => ({ ...f, standardPrice: Number(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">
                            Emergency Price (₹)
                        </label>
                        <input
                            type="number" step="0.01" min="0"
                            value={priceForm.emergencyPrice}
                            onChange={e => setPriceForm(f => ({ ...f, emergencyPrice: Number(e.target.value) }))}
                            className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-lg font-black text-orange-700 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setPriceTarget(null)}>Cancel</Button>
                        <Button type="submit" className="bg-orange-700 hover:bg-orange-800" disabled={savingPrice}>
                            {savingPrice ? 'Saving…' : 'Save Pricing'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}

// ── Test Card ─────────────────────────────────────────────────
function TestCard({ test, toggling, onToggle, onSetPrice }: {
    test: HospitalLabTestConfigDTO;
    toggling: boolean;
    onToggle: () => void;
    onSetPrice: () => void;
}) {
    return (
        <div className={`bg-white rounded-2xl border transition-all ${
            test.enabled
                ? 'border-emerald-200 shadow-sm shadow-emerald-50'
                : 'border-slate-200 opacity-70'
        }`}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase font-mono tracking-widest bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                    {test.testCode}
                </span>
                <Toggle checked={test.enabled} onChange={onToggle} loading={toggling} />
            </div>

            {/* Card body */}
            <div className="px-4 py-3">
                <p className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mb-1">{test.testName}</p>
                {test.departmentName && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{test.departmentName}</p>
                )}

                {/* Status pill */}
                <div className="mt-3 mb-3">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                        test.enabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {test.enabled ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Standard</p>
                        <p className="text-sm font-black text-slate-800">{fmt(test.standardPrice)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] font-black uppercase text-orange-400 tracking-widest mb-0.5">Emergency</p>
                        <p className="text-sm font-black text-orange-700">{fmt(test.emergencyPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Card footer */}
            <div className="px-4 pb-4">
                <button
                    onClick={onSetPrice}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-600 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-all tracking-widest"
                >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Set Price
                </button>
            </div>
        </div>
    );
}

// ── Package Card ──────────────────────────────────────────────
function PackageCard({ pkg, toggling, onToggle, onSetPrice }: {
    pkg: HospitalLabPackageConfigDTO;
    toggling: boolean;
    onToggle: () => void;
    onSetPrice: () => void;
}) {
    return (
        <div className={`bg-white rounded-2xl border transition-all ${
            pkg.enabled
                ? 'border-blue-200 shadow-sm shadow-blue-50'
                : 'border-slate-200 opacity-70'
        }`}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase font-mono tracking-widest bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {pkg.packageCode}
                </span>
                <Toggle checked={pkg.enabled} onChange={onToggle} loading={toggling} />
            </div>

            {/* Card body */}
            <div className="px-4 py-3">
                <p className="text-sm font-black text-slate-800 leading-snug line-clamp-2 mb-1">{pkg.packageName}</p>

                {/* Type + tests count row */}
                <div className="flex items-center gap-2 mb-3">
                    {pkg.packageType && (
                        <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {pkg.packageType}
                        </span>
                    )}
                    {pkg.testIds?.length > 0 && (
                        <span className="text-[9px] font-bold text-slate-400">
                            {pkg.testIds.length} tests
                        </span>
                    )}
                </div>

                {/* Status pill */}
                <div className="mb-3">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                        pkg.enabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                        {pkg.enabled ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Standard</p>
                        <p className="text-sm font-black text-slate-800">{fmt(pkg.standardPrice)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] font-black uppercase text-orange-400 tracking-widest mb-0.5">Emergency</p>
                        <p className="text-sm font-black text-orange-700">{fmt(pkg.emergencyPrice)}</p>
                    </div>
                </div>
            </div>

            {/* Card footer */}
            <div className="px-4 pb-4">
                <button
                    onClick={onSetPrice}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-600 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-all tracking-widest"
                >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    Set Price
                </button>
            </div>
        </div>
    );
}

// ── Skeleton loader ───────────────────────────────────────────
function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                        <div className="h-5 w-9 bg-slate-200 rounded-full" />
                    </div>
                    <div className="px-4 py-3 space-y-2">
                        <div className="h-4 w-3/4 bg-slate-200 rounded" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                        <div className="h-6 w-16 bg-slate-100 rounded-full mt-3" />
                        <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="h-12 bg-slate-100 rounded-xl" />
                            <div className="h-12 bg-slate-100 rounded-xl" />
                        </div>
                    </div>
                    <div className="px-4 pb-4">
                        <div className="h-9 bg-slate-100 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">inbox</span>
            <p className="text-sm font-bold text-slate-400">{label}</p>
        </div>
    );
}
