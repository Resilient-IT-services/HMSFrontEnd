'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setCurrentHospitalId, setHospitalTimezone } from '@/state/authSlice';
import { hospitalService } from '@/services/hospitalService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

const SelectHospitalPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleSelect = async (hospitalId: string) => {
    try {
      const res = await hospitalService.getById(hospitalId);
      if (res.success && res.data) {
        dispatch(setHospitalTimezone(res.data.timezone));
        dispatch(setCurrentHospitalId(hospitalId));
      } else {
        triggerGlobalToast('Failed to retrieve hospital settings', 'error');
      }
    } catch (error) {
      console.error('Hospital selection error:', error);
      triggerGlobalToast('An error occurred during hospital selection', 'error');
    }
  };

  const filteredHospitals = user?.memberships.filter(h =>
      (h.hospitalName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (h.hospitalCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  return (
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col antialiased">
        <style dangerouslySetInnerHTML={{ __html: `
        .hospital-card:hover .arrow-icon {
            transform: translateX(4px);
        }
      `}} />

        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-8 py-4 w-full sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>pulse_alert</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white font-headline-xl">Careflow System Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-full"
                title="System Help & Support"
            >
              <span className="material-symbols-outlined">help</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-gutter">
          <div className="w-full max-w-4xl animate-in fade-in duration-700">
            <div className="text-center mb-10">
              <h1 className="font-headline-xl text-on-background mb-2">Welcome Back, {user?.fullName || 'Staff'}</h1>
              <p className="font-body-lg text-secondary">Please select the facility for your current session</p>
            </div>

            <div className="mb-8 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                  className="w-full pl-12 pr-4 py-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition-all shadow-sm font-body-md text-on-surface"
                  placeholder="Search facilities by name, city, or specialty..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-component-gap">
              {filteredHospitals.map((h) => (
                  <div
                      key={h.hospitalId}
                      onClick={() => handleSelect(h.hospitalId)}
                      className="hospital-card group bg-surface-container-lowest border border-outline-variant p-6 rounded-xl cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 text-left">
                      <div className="w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-3xl">local_hospital</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-on-surface truncate" title={h.hospitalName}>{h.hospitalName}</h3>
                        <p className="font-body-sm text-secondary uppercase tracking-widest font-bold">{h.hospitalCode}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-4 border-t border-surface-container-high">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      {(h.roleAssignments || []).filter(ra => ra.active).length} Roles Assigned
                    </span>
                        <span className="arrow-icon material-symbols-outlined text-primary transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-surface-container-low rounded-xl border border-outline-variant flex items-start gap-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <div className="flex-1 text-left">
                <h4 className="font-label-md text-on-surface">Security Protocol Reminder</h4>
                <p className="font-body-sm text-secondary mt-1">Sessions are tracked per facility. Please ensure you are selecting the correct location to maintain clinical accuracy and data compliance standards. Your current IP is logged as verified hospital network.</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center px-8 py-4 w-full gap-4">
          <span className="font-manrope text-xs text-gray-500">© 2024 MedCore Health Systems. Clinical Accuracy Priority.</span>
          <div className="flex gap-6">
            <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 transition-colors underline-offset-4 hover:underline" href="#">Privacy Policy</Link>
            <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 transition-colors underline-offset-4 hover:underline" href="#">Support</Link>
            <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 transition-colors underline-offset-4 hover:underline" href="#">Security Standards</Link>
          </div>
        </footer>

        {/* System Intelligence Help Desk Popup */}
        {isHelpOpen && (
            <Modal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="System Support Desk"
                width="400px"
            >
              <div className="p-5 font-inter text-slate-800 bg-white h-[350px] flex flex-col justify-between">
                {/* User Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-orange-50/50 rounded-xl border border-orange-105">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white font-extrabold uppercase text-sm">
                      {user?.fullName ? user.fullName.slice(0, 2) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-900 truncate">{user?.fullName || 'User Profile'}</h4>
                      <p className="text-[10px] font-bold text-slate-400 truncate">@{user?.username || 'username'}</p>
                    </div>
                    {user?.active && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Account Details Grid */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Session Account Details</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-slate-400 font-medium">Email Address</span>
                        <span className="text-slate-800 font-bold truncate max-w-[200px]" title={user?.email}>{user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-slate-400 font-medium">Phone Contact</span>
                        <span className="text-slate-800 font-bold">{user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-slate-400 font-medium">Security Access</span>
                        <span className="text-orange-700 font-extrabold uppercase tracking-wide">
                          {user?.superuser ? 'Super Admin' : 'Staff Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Information & Action Button */}
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-orange-600">call</span>
                      <span>Call: <span className="text-slate-800 font-extrabold">1800-419-CARE</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-orange-600">mail</span>
                      <span>Email: <span className="text-slate-800 font-extrabold">support@medcore.com</span></span>
                    </div>
                  </div>
                  <button
                      onClick={() => setIsHelpOpen(false)}
                      className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.98] transition-transform duration-100 cursor-pointer"
                  >
                    Got It, Close Desk
                  </button>
                </div>
              </div>
            </Modal>
        )}
      </div>
  );
};

export default SelectHospitalPage;