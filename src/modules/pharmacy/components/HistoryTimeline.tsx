import React from 'react';
import { AppointmentResponse, PrescriptionDTO } from '@/types/api';

interface HistoryTimelineProps {
  appointments: AppointmentResponse[];
  prescriptions: PrescriptionDTO[];
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ appointments, prescriptions }) => {
  // Combine and sort by date
  const events = [
    ...appointments.map(a => ({ type: 'APPOINTMENT', date: a.appointmentTime, data: a })),
    ...prescriptions.map(p => ({ type: 'PRESCRIPTION', date: p.createdAt, data: p }))
  ].toSorted((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  if (events.length === 0) {
    return <div className="text-center py-8 text-gray-500">No history available for this patient.</div>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={eventIdx}>
            <div className="relative pb-8">
              {eventIdx === events.length - 1 ? null : (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                    event.type === 'APPOINTMENT' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <span className="material-symbols-outlined text-white text-sm">
                      {event.type === 'APPOINTMENT' ? 'calendar_today' : 'medication'}
                    </span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {event.type === 'APPOINTMENT' ? (
                        <>Visited <span className="font-medium text-gray-900">Dr. {(event.data as AppointmentResponse).doctorName}</span></>
                      ) : (
                        <>Prescribed by <span className="font-medium text-gray-900">{(event.data as PrescriptionDTO).doctorName}</span></>
                      )}
                    </p>
                    {event.type === 'APPOINTMENT' && (event.data as AppointmentResponse).diagnosis && (
                      <p className="mt-1 text-sm text-gray-700">Diagnosis: {(event.data as AppointmentResponse).diagnosis}</p>
                    )}
                    {event.type === 'PRESCRIPTION' && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(event.data as PrescriptionDTO).items.map((item, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.medicineName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.date}>{event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryTimeline;
