'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

export function SettingsPage() {
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const isSuper = isSuperMode || activeRole === 'SUPER_ADMIN';

  const settingsSections = [
    {
      title: 'Taxation Management',
      icon: 'percent',
      description: 'Manage tax masters, groups and rule-based application logic.',
      roles: ['ADMIN', 'SUPER_ADMIN'],
      links: [
        { label: 'Tax Masters', href: '/settings/taxation/masters', icon: 'account_balance' },
        { label: 'Tax Groups', href: '/settings/taxation/groups', icon: 'account_tree' },
        { label: 'Tax Rules', href: '/settings/taxation/rules', icon: 'rule' },
      ]
    },
    {
      title: 'Clinical Configuration',
      icon: 'clinical_notes',
      description: 'Define clinical safety thresholds and medical policy standards.',
      roles: ['SUPER_ADMIN'],
      links: [
        { label: 'Vitals Thresholds', href: '/settings/clinical/vitals', icon: 'health_metrics' },
      ]
    },
    {
      title: 'Master Catalog',
      icon: 'database',
      description: 'Manage hospital-wide catalogs for departments and specializations.',
      roles: ['SUPER_ADMIN'],
      links: [
        { label: 'Departments & Specializations', href: '/settings/catalog', icon: 'list_alt' },
      ]
    }
  ];

  const filteredSections = settingsSections.filter(section => {
    if (isSuper) return true;
    return section.roles.includes(activeRole || '');
  });

  return (
    <MainLayout title="Settings">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {filteredSections.map((section) => (
          <Card key={section.title} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-orange-700">{section.icon}</span>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{section.title}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-medium">{section.description}</p>
            <div className="space-y-2">
              {section.links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 group transition-all border border-transparent hover:border-orange-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-orange-600 transition-colors text-lg">{link.icon}</span>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-orange-700">{link.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-400 transition-all text-sm">arrow_forward_ios</span>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
