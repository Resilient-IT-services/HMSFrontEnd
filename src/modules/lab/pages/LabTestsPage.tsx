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
import { labApi, LabDepartmentDTO, LabTestDTO, LabTestParameterDTO, LabReferenceRangeDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

const CATEGORY_VARIANT: Record<string, 'orange' | 'blue' | 'emerald'> = {
    LAB: 'orange',
    RADIOLOGY: 'blue',
    CARDIOLOGY: 'emerald',
};

const emptyTest = (): LabTestDTO => ({
    testCode: '',
    testName: '',
    departmentId: '',
    category: 'LAB',
    resultEntryType: 'PARAMETER',
    resultType: 'PARAMETER',
    active: true,
});

const emptyRangeForm = (parameterId: string): LabReferenceRangeDTO => ({
    parameterId,
    gender: 'ALL',
    minAge: 0,
    maxAge: 120,
    ageUnit: 'YEARS',
    minValue: 0,
    maxValue: 0,
    criticalMin: 0,
    criticalMax: 0,
});

export function LabTestsPage() {
    // ── catalog data ──────────────────────────────────────────
    const [tests, setTests] = useState<LabTestDTO[]>([]);
    const [departments, setDepartments] = useState<LabDepartmentDTO[]>([]);
    const [loading, setLoading] = useState(true);

    // ── filters ───────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCat, setFilterCat] = useState('');

    // ── test add/edit modal ───────────────────────────────────
    const [showTestModal, setShowTestModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [testForm, setTestForm] = useState<LabTestDTO>(emptyTest());

    // ── ranges list modal ─────────────────────────────────────
    // hiddenParam = the auto-managed parameter for this test (user never sees it)
    const [rangesTest, setRangesTest] = useState<LabTestDTO | null>(null);
    const [hiddenParam, setHiddenParam] = useState<LabTestParameterDTO | null>(null);
    const [ranges, setRanges] = useState<LabReferenceRangeDTO[]>([]);
    const [rangesLoading, setRangesLoading] = useState(false);

    // ── range form modal ──────────────────────────────────────
    const [showRangeForm, setShowRangeForm] = useState(false);
    const [editingRangeId, setEditingRangeId] = useState<string | null>(null);
    const [rangeForm, setRangeForm] = useState<LabReferenceRangeDTO>(emptyRangeForm(''));

    // ── load ──────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [testsRes, deptsRes] = await Promise.all([labApi.getTests(), labApi.getDepartments()]);
            if (testsRes.success && testsRes.data) setTests(testsRes.data);
            if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
        } catch {
            triggerGlobalToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    // ── filtered rows ─────────────────────────────────────────
    const filtered = tests.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.testName.toLowerCase().includes(q) || t.testCode.toLowerCase().includes(q);
        const matchDept = !filterDept || t.departmentId === filterDept;
        const matchCat = !filterCat || t.category === filterCat;
        return matchSearch && matchDept && matchCat;
    });

    // ── test CRUD ─────────────────────────────────────────────
    const openAdd = () => {
        setEditingId(null);
        setTestForm(emptyTest());
        setShowTestModal(true);
    };

    const openEdit = (t: LabTestDTO) => {
        setEditingId(t.id!);
        setTestForm({ ...t });
        setShowTestModal(true);
    };

    const handleDelete = async (t: LabTestDTO) => {
        if (!confirm(`Delete test "${t.testName}"?`)) return;
        try {
            await labApi.deleteTest(t.id!);
            triggerGlobalToast('Test deleted', 'success');
            void fetchData();
        } catch { /* handled */ }
    };

    const handleTestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testForm.departmentId) { triggerGlobalToast('Select a department', 'error'); return; }
        try {
            const res = editingId
                ? await labApi.updateTest(editingId, testForm)
                : await labApi.createTest(testForm);
            if (res.success) {
                triggerGlobalToast(`Test ${editingId ? 'updated' : 'created'}`, 'success');
                setShowTestModal(false);
                void fetchData();
            }
        } catch { /* handled */ }
    };

    // ── get-or-create hidden param for a test ─────────────────
    // Returns the parameterId to use when creating ranges.
    // User never sees this — we manage it transparently.
    const resolveParam = async (test: LabTestDTO): Promise<LabTestParameterDTO> => {
        const res = await labApi.getParametersByTest(test.id!);
        if (res.success && res.data && res.data.length > 0) return res.data[0];
        // Create a default parameter silently
        const created = await labApi.createParameter({
            testId: test.id!,
            parameterName: test.testName,
            unit: '',
            displayOrder: 1,
        });
        if (created.success && created.data) return created.data;
        throw new Error('Could not resolve parameter');
    };

    // ── refresh ranges for the current hidden param ───────────
    const refreshRanges = async (param: LabTestParameterDTO) => {
        const res = await labApi.getRangesByParameter(param.id!);
        if (res.success && res.data) setRanges(res.data);
        else setRanges([]);
    };

    // ── open ranges modal ─────────────────────────────────────
    const openRanges = async (t: LabTestDTO) => {
        setRangesTest(t);
        setRanges([]);
        setHiddenParam(null);
        setRangesLoading(true);
        try {
            const param = await resolveParam(t);
            setHiddenParam(param);
            await refreshRanges(param);
        } catch {
            triggerGlobalToast('Failed to load ranges', 'error');
        } finally {
            setRangesLoading(false);
        }
    };

    const closeRanges = () => { setRangesTest(null); setHiddenParam(null); setRanges([]); };

    // ── open add range form ───────────────────────────────────
    const openAddRange = () => {
        if (!hiddenParam?.id) return;
        setEditingRangeId(null);
        setRangeForm(emptyRangeForm(hiddenParam.id));
        setShowRangeForm(true);
    };

    // ── open edit range form ──────────────────────────────────
    const openEditRange = (r: LabReferenceRangeDTO) => {
        setEditingRangeId(r.id!);
        setRangeForm({ ...r });
        setShowRangeForm(true);
    };

    // ── save range ────────────────────────────────────────────
    const handleRangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = editingRangeId
                ? await labApi.updateRange(editingRangeId, rangeForm)
                : await labApi.createRange(rangeForm);
            if (res.success) {
                triggerGlobalToast('Range saved', 'success');
                setShowRangeForm(false);
                if (hiddenParam) await refreshRanges(hiddenParam);
            }
        } catch { /* handled */ }
    };

    // ── delete range ──────────────────────────────────────────
    const handleDeleteRange = async (r: LabReferenceRangeDTO) => {
        if (!confirm('Delete this range?')) return;
        try {
            await labApi.deleteRange(r.id!);
            triggerGlobalToast('Range deleted', 'success');
            if (hiddenParam) await refreshRanges(hiddenParam);
        } catch { /* handled */ }
    };

    // ── table columns ─────────────────────────────────────────
    const columns: Column<LabTestDTO>[] = [
        {
            header: 'Code',
            render: (t) => (
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider font-mono bg-slate-100 px-2 py-1 rounded">
                    {t.testCode}
                </span>
            ),
        },
        {
            header: 'Test Name',
            render: (t) => (
                <div>
                    <p className="text-sm font-bold text-slate-800">{t.testName}</p>
                    {t.shortName && <p className="text-[10px] text-slate-400 font-medium">{t.shortName}</p>}
                </div>
            ),
        },
        {
            header: 'Category',
            render: (t) => (
                <Badge variant={CATEGORY_VARIANT[t.category] ?? 'slate'} size="sm">{t.category}</Badge>
            ),
        },
        {
            header: 'Department',
            render: (t) => (
                <span className="text-xs font-bold text-slate-600">{t.departmentName ?? '—'}</span>
            ),
        },
        {
            header: 'Result Format',
            render: (t) => (
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    t.resultEntryType === 'PARAMETER'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                }`}>
                    {t.resultEntryType === 'PARAMETER' ? 'Grid' : 'Narrative'}
                </span>
            ),
        },
        {
            header: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (t) => (
                <div className="flex justify-end items-center gap-1">
                    <button
                        onClick={() => void openRanges(t)}
                        title="Reference Ranges"
                        className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">clinical_notes</span>
                        Ranges
                    </button>
                    <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                        onClick={() => void handleDelete(t)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <MainLayout title="Atomic Tests Catalog">
            <PageSurface>
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Atomic Tests Catalog"
                        description="Individual diagnostic tests with reference ranges. Panels like CBC are managed under Lab Packages."
                    />

                    <ContentPanel>
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="relative flex-1 max-w-xs">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name or code..."
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <select
                                    value={filterDept}
                                    onChange={e => setFilterDept(e.target.value)}
                                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all"
                                >
                                    <option value="">All Departments</option>
                                    {departments.filter(d => d.active).map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={filterCat}
                                    onChange={e => setFilterCat(e.target.value)}
                                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all"
                                >
                                    <option value="">All Categories</option>
                                    <option value="LAB">Pathology</option>
                                    <option value="RADIOLOGY">Radiology</option>
                                    <option value="CARDIOLOGY">Cardiology</option>
                                </select>
                            </div>
                            <Button size="sm" icon="add" onClick={openAdd}>
                                Add Atomic Test
                            </Button>
                        </div>

                        {!loading && (
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                {filtered.length} test{filtered.length === 1 ? '' : 's'}{search || filterDept || filterCat ? ' (filtered)' : ''}
                            </p>
                        )}

                        <Table columns={columns} data={filtered} isLoading={loading} />
                    </ContentPanel>
                </div>
            </PageSurface>

            {/* ── Add/Edit Test Modal ───────────────────────────── */}
            <Modal
                isOpen={showTestModal}
                onClose={() => setShowTestModal(false)}
                title={editingId ? 'Edit Test' : 'Add Atomic Test'}
                size="xl"
            >
                <form onSubmit={e => void handleTestSubmit(e)} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                                Test Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={testForm.testCode}
                                onChange={e => setTestForm({ ...testForm, testCode: e.target.value.toUpperCase() })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                                placeholder="e.g. HGB"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                                Test Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={testForm.testName}
                                onChange={e => setTestForm({ ...testForm, testName: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                placeholder="e.g. Hemoglobin"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">
                                Department <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={testForm.departmentId}
                                onChange={e => setTestForm({ ...testForm, departmentId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.filter(d => d.active).map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Category</label>
                            <select
                                value={testForm.category}
                                onChange={e => setTestForm({ ...testForm, category: e.target.value as LabTestDTO['category'] })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            >
                                <option value="LAB">Pathology / Lab</option>
                                <option value="RADIOLOGY">Radiology</option>
                                <option value="CARDIOLOGY">Cardiology</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Result Format</label>
                            <select
                                value={testForm.resultEntryType}
                                onChange={e => setTestForm({ ...testForm, resultEntryType: e.target.value as LabTestDTO['resultEntryType'], resultType: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                            >
                                <option value="PARAMETER">Parameter Grid</option>
                                <option value="NARRATIVE">Narrative Text</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">HSN Code</label>
                            <input
                                value={testForm.hsnCode ?? ''}
                                onChange={e => setTestForm({ ...testForm, hsnCode: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                                placeholder="e.g. 3822"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowTestModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-orange-700 hover:bg-orange-800">
                            {editingId ? 'Update Test' : 'Create Test'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Ranges List Modal ─────────────────────────────── */}
            <Modal
                isOpen={!!rangesTest}
                onClose={closeRanges}
                title=""
                size="lg"
            >
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600">clinical_notes</span>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Reference Ranges</p>
                                <h2 className="text-base font-black text-slate-900">
                                    {rangesTest?.testName}
                                    <span className="ml-2 text-[10px] font-black text-slate-400 font-mono normal-case">{rangesTest?.testCode}</span>
                                </h2>
                            </div>
                        </div>
                        <Button size="sm" icon="add" onClick={openAddRange} className="bg-emerald-700 hover:bg-emerald-800">
                            Add Reference Range
                        </Button>
                    </div>

                    {/* Range list */}
                    <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                        {rangesLoading ? (
                            <div className="py-16 text-center text-sm text-slate-400">Loading ranges...</div>
                        ) : ranges.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">data_table</span>
                                <p className="text-sm font-bold text-slate-400">No ranges configured yet</p>
                                <p className="text-xs text-slate-300 mt-1">Click &quot;Add Reference Range&quot; to get started</p>
                            </div>
                        ) : ranges.map(r => (
                            <div
                                key={r.id}
                                onClick={() => openEditRange(r)}
                                className="flex items-center justify-between border border-slate-200 rounded-xl px-5 py-4 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all group"
                            >
                                {/* Left: gender + age */}
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                                        r.gender === 'MALE' ? 'bg-blue-100 text-blue-700'
                                        : r.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {r.gender}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        Age {r.minAge}–{r.maxAge} {r.ageUnit?.toLowerCase()}
                                    </span>
                                </div>

                                {/* Right: values + delete */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Normal</p>
                                        <p className="text-sm font-black text-emerald-800">{r.minValue} – {r.maxValue}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-red-500 tracking-widest">Critical</p>
                                        <p className="text-xs font-black text-red-700">{r.criticalMin} / {r.criticalMax}</p>
                                    </div>
                                    <button
                                        onClick={ev => { ev.stopPropagation(); void handleDeleteRange(r); }}
                                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* ── Range Form Modal ───────────────────────────────── */}
            <Modal
                isOpen={showRangeForm}
                onClose={() => setShowRangeForm(false)}
                title={editingRangeId ? 'Edit Reference Range' : 'Add Reference Range'}
                size="lg"
            >
                <form onSubmit={e => void handleRangeSubmit(e)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Gender</label>
                            <select
                                value={rangeForm.gender}
                                onChange={e => setRangeForm({ ...rangeForm, gender: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                            >
                                <option value="ALL">All Genders</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Age Unit</label>
                            <select
                                value={rangeForm.ageUnit}
                                onChange={e => setRangeForm({ ...rangeForm, ageUnit: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                            >
                                <option value="YEARS">Years</option>
                                <option value="MONTHS">Months</option>
                                <option value="DAYS">Days</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Min Age</label>
                            <input
                                type="number"
                                value={rangeForm.minAge}
                                onChange={e => setRangeForm({ ...rangeForm, minAge: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Max Age</label>
                            <input
                                type="number"
                                value={rangeForm.maxAge}
                                onChange={e => setRangeForm({ ...rangeForm, maxAge: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Normal Range</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-emerald-600 mb-1">Min Value</label>
                                <input
                                    type="number" step="0.01"
                                    value={rangeForm.minValue}
                                    onChange={e => setRangeForm({ ...rangeForm, minValue: Number(e.target.value) })}
                                    className="w-full bg-white border border-emerald-200 rounded-lg px-4 py-2 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-emerald-600 mb-1">Max Value</label>
                                <input
                                    type="number" step="0.01"
                                    value={rangeForm.maxValue}
                                    onChange={e => setRangeForm({ ...rangeForm, maxValue: Number(e.target.value) })}
                                    className="w-full bg-white border border-emerald-200 rounded-lg px-4 py-2 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Critical Limits</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-red-500 mb-1">Critical Min</label>
                                <input
                                    type="number" step="0.01"
                                    value={rangeForm.criticalMin}
                                    onChange={e => setRangeForm({ ...rangeForm, criticalMin: Number(e.target.value) })}
                                    className="w-full bg-white border border-red-200 rounded-lg px-4 py-2 text-sm font-bold text-red-900 outline-none focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-red-500 mb-1">Critical Max</label>
                                <input
                                    type="number" step="0.01"
                                    value={rangeForm.criticalMax}
                                    onChange={e => setRangeForm({ ...rangeForm, criticalMax: Number(e.target.value) })}
                                    className="w-full bg-white border border-red-200 rounded-lg px-4 py-2 text-sm font-bold text-red-900 outline-none focus:border-red-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <Button type="button" variant="secondary" onClick={() => setShowRangeForm(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">Save Range</Button>
                    </div>
                </form>
            </Modal>
        </MainLayout>
    );
}
