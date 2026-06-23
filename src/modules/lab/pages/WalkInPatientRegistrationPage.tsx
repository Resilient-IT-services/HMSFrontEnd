'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { labApi, HospitalLabTestConfigDTO, HospitalLabPackageConfigDTO } from '@/modules/lab/api/labApi';

interface SelectedItem {
  id: string;
  name: string;
  type: 'TEST' | 'PACKAGE';
  price?: number;
}

export function WalkInPatientRegistrationPage() {
  const router = useRouter();

  // Patient info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Test/package catalog
  const [tests, setTests] = useState<HospitalLabTestConfigDTO[]>([]);
  const [packages, setPackages] = useState<HospitalLabPackageConfigDTO[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [testsRes, pkgRes] = await Promise.all([
        labApi.getAdminTests(),
        labApi.getAdminPackages(),
      ]);
      if (testsRes.success && testsRes.data) {
        setTests(testsRes.data.filter(t => t.enabled));
      }
      if (pkgRes.success && pkgRes.data) {
        setPackages(pkgRes.data.filter(p => p.enabled));
      }
    };
    void load();
  }, []);

  const filteredTests = tests.filter(t =>
    !selected.some(s => s.id === t.testId) &&
    (t.testName.toLowerCase().includes(search.toLowerCase()) ||
      t.testCode.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPackages = packages.filter(p =>
    !selected.some(s => s.id === p.packageId) &&
    p.packageName.toLowerCase().includes(search.toLowerCase())
  );

  const addTest = (t: HospitalLabTestConfigDTO) => {
    const coveringPackage = selected.find(
      s => s.type === 'PACKAGE' && packages.find(p => p.packageId === s.id)?.testIds.includes(t.testId)
    );
    if (coveringPackage) {
      triggerGlobalToast(
        `"${t.testName}" is already included in "${coveringPackage.name}". Adding it separately would cause duplicate billing.`,
        'error'
      );
      setSearch('');
      return;
    }
    setSelected(prev => [...prev, { id: t.testId, name: t.testName, type: 'TEST', price: t.standardPrice }]);
    setSearch('');
  };

  const addPackage = (p: HospitalLabPackageConfigDTO) => {
    const superseded = selected.filter(
      s => s.type === 'TEST' && p.testIds.includes(s.id)
    );
    if (superseded.length > 0) {
      const names = superseded.map(s => `"${s.name}"`).join(', ');
      triggerGlobalToast(
        `${names} removed — already included in "${p.packageName}".`,
        'info'
      );
      setSelected(prev =>
        prev
          .filter(s => !(s.type === 'TEST' && p.testIds.includes(s.id)))
          .concat({ id: p.packageId, name: p.packageName, type: 'PACKAGE', price: p.standardPrice ? Number(p.standardPrice) : undefined })
      );
    } else {
      setSelected(prev => [...prev, {
        id: p.packageId,
        name: p.packageName,
        type: 'PACKAGE',
        price: p.standardPrice ? Number(p.standardPrice) : undefined,
      }]);
    }
    setSearch('');
  };

  const remove = (id: string) => setSelected(prev => prev.filter(s => s.id !== id));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Patient name is required';
    if (!phone.trim()) next.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone)) next.phone = 'Must be exactly 10 digits';
    if (selected.length === 0) next.tests = 'Select at least one test or package';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await labApi.createWalkInOrder({
        walkInName: name.trim(),
        walkInPhone: phone.trim(),
        walkInAddress: address.trim() || undefined,
        testIds: selected.filter(s => s.type === 'TEST').map(s => s.id),
        packageIds: selected.filter(s => s.type === 'PACKAGE').map(s => s.id),
      });
      if (res.success) {
        triggerGlobalToast('Walk-in order created successfully', 'success');
        router.push('/lab_admin/queue');
      } else {
        triggerGlobalToast(res.message || 'Failed to create order', 'error');
      }
    } catch {
      triggerGlobalToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const showDropdown = search.length > 0 && (filteredTests.length > 0 || filteredPackages.length > 0);
  const totalPrice = selected.reduce((sum, s) => sum + (s.price ?? 0), 0);

  return (
    <MainLayout title="Walk-in Lab Order" hideTitle>
      <PageSurface maxWidthClassName="max-w-[1600px]" backgroundClassName="bg-[#f8f9fb]" fontClassName="font-inter">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Walk-in Lab Order</h1>
          <span className="text-[10px] font-black uppercase px-3 py-1 bg-orange-100 text-orange-700 rounded-lg border border-orange-200 tracking-wider">
            Walk-in
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Left: patient info + test search */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient info */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:border-orange-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {errors.name && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                    placeholder="10-digit number"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:border-orange-500 ${errors.phone ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {errors.phone && <p className="text-[9px] font-bold text-red-500 mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 tracking-wider">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </section>

            {/* Test / package search */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-visible">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Select Tests / Packages</h2>
                <div className="relative w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search test or package..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-orange-500"
                  />
                  {showDropdown && (
                    <div className="absolute top-full mt-1 right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto">
                      {filteredTests.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase text-slate-400 tracking-wider">Tests</p>
                          {filteredTests.slice(0, 6).map(t => (
                            <button
                              key={t.testId}
                              onClick={() => addTest(t)}
                              className="w-full text-left px-3 py-2 hover:bg-orange-50 text-xs transition-colors flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{t.testName}</p>
                                <p className="text-[9px] text-slate-400">{t.testCode} · {t.departmentName}</p>
                              </div>
                              {t.standardPrice && (
                                <span className="text-[10px] font-black text-orange-700 shrink-0">₹{t.standardPrice}</span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                      {filteredPackages.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-[9px] font-black uppercase text-slate-400 tracking-wider border-t border-slate-100 mt-1">Packages</p>
                          {filteredPackages.slice(0, 4).map(p => (
                            <button
                              key={p.packageId}
                              onClick={() => addPackage(p)}
                              className="w-full text-left px-3 py-2 hover:bg-orange-50 text-xs transition-colors flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{p.packageName}</p>
                                <p className="text-[9px] text-slate-400">{p.testIds?.length ?? 0} tests · {p.packageType}</p>
                              </div>
                              {p.standardPrice && (
                                <span className="text-[10px] font-black text-blue-700 shrink-0">₹{p.standardPrice}</span>
                              )}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                {errors.tests && (
                  <p className="text-[9px] font-bold text-red-500 mb-3 uppercase">{errors.tests}</p>
                )}
                {selected.length === 0 ? (
                  <div className="py-12 text-center text-slate-300">
                    <span className="material-symbols-outlined text-4xl block mb-1">biotech</span>
                    <p className="text-xs font-medium">Search and add tests or packages above</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[9px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                        <th className="pb-2 px-2">Name</th>
                        <th className="pb-2 px-2">Type</th>
                        <th className="pb-2 px-2 text-right">Price</th>
                        <th className="pb-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.map(s => (
                        <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-2 font-bold text-slate-900">{s.name}</td>
                          <td className="py-2.5 px-2">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${s.type === 'PACKAGE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {s.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-slate-700">
                            {s.price ? `₹${s.price}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button onClick={() => remove(s.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Right: Order summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-md flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Order Summary</p>

              {/* Patient preview */}
              <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Patient</p>
                <p className="font-black text-slate-900 text-sm">{name || <span className="text-slate-300 font-medium">—</span>}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{phone || '—'}</p>
                {address && <p className="text-[10px] text-slate-400 mt-0.5">{address}</p>}
              </div>

              {/* Tests summary */}
              <div className="space-y-1.5 mb-3">
                {selected.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium truncate mr-2">{s.name}</span>
                    <span className="font-bold text-slate-900 shrink-0">{s.price ? `₹${s.price}` : '—'}</span>
                  </div>
                ))}
              </div>

              {totalPrice > 0 && (
                <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Estimated Total</span>
                  <span className="text-2xl font-black text-orange-700">₹{totalPrice}</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <button
                onClick={handleSubmit}
                disabled={submitting || selected.length === 0 || !name || !phone}
                className={`w-full py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  submitting || selected.length === 0 || !name || !phone
                    ? 'bg-slate-200 cursor-not-allowed text-slate-400'
                    : 'bg-orange-700 hover:bg-orange-800 shadow'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">biotech</span>
                    <span>Create Walk-in Order</span>
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/lab_admin/queue')}
                className="w-full mt-2 py-2 text-slate-400 font-black text-[10px] uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
}
