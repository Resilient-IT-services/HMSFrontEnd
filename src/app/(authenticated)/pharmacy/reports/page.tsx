'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';

export default function ReportsPage() {
  const reports = [
    { title: 'Sales Summary', description: 'Daily, weekly, and monthly sales reports.', icon: 'payments', color: 'bg-blue-50 text-blue-600' },
    { title: 'Inventory Valuation', description: 'Current value of all stock in hand.', icon: 'inventory_2', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Expiry Report', description: 'List of medicines expiring in the next 6 months.', icon: 'event_busy', color: 'bg-red-50 text-red-600' },
    { title: 'Purchase History', description: 'Log of all stock entries and purchase orders.', icon: 'shopping_bag', color: 'bg-orange-50 text-orange-600' },
    { title: 'Low Stock Report', description: 'Items that are below reorder level.', icon: 'warning', color: 'bg-amber-50 text-amber-600' },
    { title: 'Tax Report', description: 'Summary of GST/Tax collected on sales.', icon: 'account_balance_wallet', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <MainLayout title="Pharmacy Reports">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${report.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{report.icon}</span>
                </div>
                <button className="text-slate-300 group-hover:text-orange-600 transition-colors">
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{report.description}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last generated: 2h ago</span>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4">Custom Report Builder</h2>
            <p className="text-slate-400 max-w-xl mb-8">Generate specialized reports by selecting specific dates, categories, and metrics. Export to PDF, Excel, or CSV formats.</p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-orange-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-800 transition-all shadow-lg shadow-orange-700/20 active:scale-95">Start Building</button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95">View Schedule</button>
            </div>
          </div>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-10">
            <span className="material-symbols-outlined text-[300px]">analytics</span>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
