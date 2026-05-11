'use client';

import React from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { AppointmentSummaryDTO } from '@/types/api';
import { useRouter } from 'next/navigation';
import { formatToken } from '@/utils/tokenHelper';
import { Modal } from '@/components/ui/Modal';
import { useReceptionAppointments } from '@/modules/reception/hooks/useReceptionAppointments';
import { PageHeading } from '@/components/ui/PageHeading';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';

export const AppointmentsPage = () => {
  const router = useRouter();
  const {
    appointments,
    loading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    isFilterModalOpen,
    setIsFilterModalOpen,
    advancedFilters,
    setAdvancedFilters,
    activeFilters,
    stats,
    applyFilters,
    resetFilters,
    removeFilter,
    refresh
  } = useReceptionAppointments();

  const columns: Column<AppointmentSummaryDTO>[] = [
    {
      header: 'Token',
      render: (app) => <span className="font-bold text-slate-900">{formatToken(app)}</span>
    },
    {
      header: 'Time',
      render: (app) => (
        <span className="font-bold text-slate-900">
          {new Date(app.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Patient',
      render: (app) => (
        <div>
          <p className="font-bold text-slate-900">{app.patientName}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Code: {(app as any).patientCode || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Doctor',
      render: (app) => (
        <div>
          <p className="font-medium text-slate-700">{app.doctorName}</p>
          <p className="text-[10px] text-slate-400 uppercase font-bold">{app.doctorSpecialization}</p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (app) => {
        const variants: Record<string, any> = {
          WALK_IN: 'emerald',
          SCHEDULED: 'blue',
          PAYMENT_PENDING: 'orange',
          ADD_VITALS: 'purple',
          WAITING_FOR_VITALS: 'purple',
          COMPLETED: 'emerald',
          CANCELLED: 'red'
        };
        return <Badge variant={variants[app.status] || 'slate'}>{app.status.replace('_', ' ')}</Badge>;
      }
    },
    {
      header: 'Actions',
      headerClassName: 'text-center',
      className: 'text-center',
      render: (app) => (
        <div className="flex items-center justify-center gap-2">
          <Button 
            size="sm" 
            icon="vital_signs"
            onClick={() => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
          >
            Vitals
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            icon="payments"
            className="border-orange-700 text-orange-700 hover:bg-orange-50"
            onClick={() => router.push(`/reception/billing?appointmentId=${app.id}`)}
          >
            Bill
          </Button>
        </div>
      )
    }
  ];

  const statConfig = [
    { label: 'Today Total', value: stats.total, variant: 'slate', filter: 'ALL' },
    { label: 'Walk-In', value: stats.walkIn, variant: 'emerald', filter: 'WALK_IN' },
    { label: 'Upcoming', value: stats.upcoming, variant: 'blue', filter: 'UPCOMING' },
    { label: 'Pay Pending', value: stats.paymentPending, variant: 'orange', filter: 'PAYMENT_PENDING' },
    { label: 'Waiting Vitals', value: stats.waitingForVitals, variant: 'purple', filter: 'WAITING_FOR_VITALS' },
    { label: 'Completed', value: stats.completed, variant: 'emerald', filter: 'COMPLETED' },
    { label: 'Cancelled', value: stats.cancelled, variant: 'red', filter: 'CANCELLED' },
  ];

  return (
    <MainLayout title="Appointments Dashboard" hideTitle>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 bg-gray-50/50 min-h-screen">
        
        <PageHeading 
          title="Today's Appointments" 
          description="Real-time status of all patient visits for today."
        >
          <Button 
            variant="secondary" 
            icon="filter_list" 
            onClick={() => setIsFilterModalOpen(true)}
          >
            Filters {(activeFilters.statuses?.length || 0) + (activeFilters.paymentStatuses?.length || 0) > 0 && 
              `(${(activeFilters.statuses?.length || 0) + (activeFilters.paymentStatuses?.length || 0)})`}
          </Button>
          <Button icon="add_circle" href="/reception/patient-registration">
            New Visit
          </Button>
        </PageHeading>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {statConfig.map((stat, i) => (
            <div 
              key={i} 
              onClick={() => {
                setStatusFilter(stat.filter as any);
                if (activeFilters.statuses?.length) {
                  resetFilters();
                }
              }}
              className={`cursor-pointer transition-all active:scale-95 ${statusFilter === stat.filter ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
            >
              <MetricCard 
                label={stat.label} 
                value={stat.value} 
                icon={statusFilter === stat.filter ? 'check_circle' : 'analytics'} 
                variant={stat.variant as any} 
              />
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['ALL', 'UPCOMING', 'SCHEDULED', 'WALK_IN', 'PAYMENT_PENDING', 'ADD_VITALS', 'WAITING_FOR_VITALS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status as any);
                  if (activeFilters.statuses?.length) {
                    resetFilters();
                  }
                }}
                className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  statusFilter === status 
                    ? 'bg-orange-700 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' ? 'Today' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-64">
              <SearchInput
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="secondary" 
              icon="filter_list" 
              onClick={() => setIsFilterModalOpen(true)}
              className={Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : !!v) ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}
            />
            <Button 
              variant="secondary" 
              icon="refresh" 
              isLoading={loading} 
              onClick={() => refresh()} 
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {Object.values(activeFilters).some(v => Array.isArray(v) ? v.length > 0 : !!v) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>
            {activeFilters.statuses?.map((s: string) => (
              <Badge key={s} variant="purple" className="gap-1">
                Status: {s.replace('_', ' ')}
                <button onClick={() => removeFilter('statuses', s)} className="hover:text-purple-900">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </Badge>
            ))}
            {activeFilters.paymentStatuses?.map((ps: string) => (
              <Badge key={ps} variant="orange" className="gap-1">
                Payment: {ps}
                <button onClick={() => removeFilter('paymentStatuses', ps)} className="hover:text-amber-900">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </Badge>
            ))}
            <button 
              onClick={resetFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 underline transition-colors ml-2"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table 
            columns={columns} 
            data={appointments} 
            isLoading={loading}
            onRowDoubleClick={(app) => router.push(`/reception/appointments/vitals?appointmentId=${app.id}`)}
            emptyMessage="No appointments found for selected filters."
          />
        </div>
      </div>

      <Modal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        title="Advanced Filters"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Appointment Status</label>
            <div className="flex flex-wrap gap-2">
              {['SCHEDULED', 'WALK_IN', 'PAYMENT_PENDING', 'ADD_VITALS', 'WAITING_FOR_VITALS', 'COMPLETED', 'CANCELLED'].map(s => (
                <label key={s} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  advancedFilters.statuses.includes(s) 
                    ? 'bg-orange-700 text-white border-orange-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                }`}>
                  <input 
                    type="checkbox" 
                    hidden
                    checked={advancedFilters.statuses.includes(s)}
                    onChange={(e) => {
                      const items = e.target.checked 
                        ? [...advancedFilters.statuses, s]
                        : advancedFilters.statuses.filter(i => i !== s);
                      setAdvancedFilters({...advancedFilters, statuses: items});
                    }}
                  />
                  <span className="text-[10px] font-bold">{s.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Payment Status</label>
            <div className="flex flex-wrap gap-2">
              {['PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'].map(ps => (
                <label key={ps} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  advancedFilters.paymentStatuses.includes(ps) 
                    ? 'bg-blue-700 text-white border-blue-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}>
                  <input 
                    type="checkbox" 
                    hidden
                    checked={advancedFilters.paymentStatuses.includes(ps)}
                    onChange={(e) => {
                      const items = e.target.checked 
                        ? [...advancedFilters.paymentStatuses, ps]
                        : advancedFilters.paymentStatuses.filter(i => i !== ps);
                      setAdvancedFilters({...advancedFilters, paymentStatuses: items});
                    }}
                  />
                  <span className="text-[10px] font-bold">{ps.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={resetFilters}>Reset All</Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
