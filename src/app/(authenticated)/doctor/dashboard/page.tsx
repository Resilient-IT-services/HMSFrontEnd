'use client';

import React, { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { appointmentService } from '@/services/appointmentService';
import { AppointmentResponse } from '@/types/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

const DoctorDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch appointments for this doctor. The API uses doctorName as a search filter.
        const res = await appointmentService.list(0, 100, user.fullName);
        if (res.success && res.data) {
          // Filter for today's appointments (assuming backend doesn't filter by date by default)
          const today = new Date().toISOString().split('T')[0];
          const todayApps = res.data.content.filter(a => a.appointmentTime.startsWith(today));
          setAppointments(todayApps);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = useMemo(() => {
    const waiting = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
    const inConsult = appointments.filter(a => a.status === 'CHECKED_IN').length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    return {
      total: appointments.length,
      waiting,
      inConsult,
      completed
    };
  }, [appointments]);

  const queue = useMemo(() => {
    return appointments
      .filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED')
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }, [appointments]);

  return (
    <MainLayout title="Doctor Dashboard" hideTitle>
      <div className="p-8 max-w-7xl mx-auto w-full -m-8 bg-[#f9f9ff] min-h-screen">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-8 flex justify-between items-center relative overflow-hidden shadow-sm">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2 font-manrope">Good morning, Dr. {user?.fullName.split(' ')[0]}</h2>
              <p className="text-slate-500 max-w-lg">You have {stats.total} consultations scheduled for today. {stats.waiting} patients are currently waiting in the queue.</p>
              <div className="flex gap-4 mt-6">
                <button className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-600/20">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  Start Next Consultation
                </button>
                <button className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 active:scale-95 transition-all">
                  <span className="material-symbols-outlined">list_alt</span>
                  Go to Queue
                </button>
              </div>
            </div>
            <div className="hidden lg:block absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-100/50 to-transparent"></div>
            <div className="hidden lg:flex items-center justify-center pr-8 z-10">
              <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-6xl">medical_services</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Patients', value: stats.total, color: 'bg-orange-600', trend: '12%', icon: 'trending_up' },
            { label: 'Waiting', value: stats.waiting, color: 'bg-orange-400', icon: 'hourglass_empty' },
            { label: 'In-Consultation', value: stats.inConsult, color: 'bg-blue-500', icon: 'clinical_notes' },
            { label: 'Completed', value: stats.completed, color: 'bg-green-500', icon: 'check_circle' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold text-slate-900">{stat.value < 10 ? `0${stat.value}` : stat.value}</h3>
                {stat.trend ? (
                  <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> {stat.trend}
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-slate-300" style={{ color: stat.color.replace('bg-', '') }}>{stat.icon}</span>
                )}
              </div>
              <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${(stat.value / (stats.total || 1)) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </section>

        {/* Main Bento Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue Preview */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full">
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 font-manrope">Upcoming Patient Queue</h3>
                <button className="text-orange-600 text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-50">
                {queue.map((app, idx) => (
                  <div key={app.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}>
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{app.patientName}</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black">
                          Scheduled: {app.appointmentTime.split('T')[1].substring(0, 5)} • {app.notes || 'Routine Checkup'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        app.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                        app.status === 'SCHEDULED' || app.status === 'CONFIRMED' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {app.status === 'CHECKED_IN' ? 'Waiting' : app.status}
                      </span>
                      <button className="p-2 text-slate-300 hover:text-orange-600 transition-colors">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
                {queue.length === 0 && !loading && (
                  <div className="p-12 text-center">
                    <p className="text-slate-400 text-sm italic">No patients in the queue for today.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Side Panels */}
          <div className="flex flex-col gap-6">
            {/* Current Patient Mini-Card */}
            <div className="bg-orange-600 text-white p-6 rounded-xl border border-orange-500 relative overflow-hidden shadow-lg shadow-orange-600/20">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Active Consultation</span>
                  <span className="text-[10px] font-mono font-bold">00:14:22</span>
                </div>
                {queue.filter(a => a.status === 'CHECKED_IN').length > 0 ? (
                  <>
                    <h4 className="text-xl font-bold mb-1">{queue.find(a => a.status === 'CHECKED_IN')?.patientName}</h4>
                    <p className="text-xs opacity-90 mb-4">Patient currently checked in</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl font-bold mb-1">No Active Patient</h4>
                    <p className="text-xs opacity-90 mb-4">Ready for next patient</p>
                  </>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 bg-white text-orange-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">View Record</button>
                  <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                </div>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10">person</span>
            </div>

            {/* Task List / Reminders */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex-1 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Admin Tasks</h3>
              <div className="space-y-4">
                {[
                  { title: 'Sign discharge papers for Unit 4', sub: 'Due by 12:00 PM', done: false },
                  { title: 'Review surgery roster for Monday', sub: 'High Priority', done: false },
                  { title: 'Updated prescription for Bed 12', sub: 'Completed', done: true }
                ].map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.done ? 'bg-orange-600 border-orange-600' : 'border-slate-300'}`}>
                      {task.done && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{task.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors">
                + Add new task
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDashboard;
