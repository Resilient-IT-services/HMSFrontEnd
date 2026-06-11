'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { labApi, LabQueueItemDTO } from '@/modules/lab/api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/formatters';
import { LabReportPreviewModal } from '../components/LabReportPreviewModal';

const LabReportsPage = () => {
  const [reports, setReports] = useState<LabQueueItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching verified reports
      const res = await labApi.getPagedQueue('VERIFIED', 0, 100);
      if (res.success && res.data) {
        setReports(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch verified reports:', error);
      triggerGlobalToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
        const init = async () => {
            await fetchReports();
        };
        init();
    }, [fetchReports]);

  const handlePreviewReport = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsPreviewModalOpen(true);
  };

  const filteredReports = reports.filter(item => 
    item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<LabQueueItemDTO>[] = [
    {
      header: 'Order Info',
      render: (item) => (
        <div>
          <p className="text-sm font-bold text-slate-800">{item.orderNumber}</p>
          <p className="text-[10px] text-slate-400 font-bold">{formatDateTime(item.orderedAt)}</p>
        </div>
      )
    },
    {
      header: 'Patient Details',
      render: (item) => (
        <div>
          <p className="text-sm font-bold text-slate-800">{item.patientName}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.patientId}</p>
        </div>
      )
    },
    {
      header: 'Test Name',
      render: (item) => <span className="text-sm font-bold text-slate-700">{item.testName}</span>
    },
    {
      header: 'Referred By',
      render: (item) => <span className="text-xs font-bold text-slate-600">{item.doctorName || 'Self'}</span>
    },
    {
      header: 'Status',
      render: () => (
        <Badge variant="emerald" size="sm">
          VERIFIED
        </Badge>
      )
    },
    {
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item) => (
        <Button size="sm" variant="secondary" onClick={() => handlePreviewReport(item.orderId)}>
          <span className="material-symbols-outlined text-sm mr-1">visibility</span>
          View Report
        </Button>
      )
    }
  ];

  return (
    <MainLayout title="Laboratory Reports">
      <PageSurface>
        <div className="space-y-4 py-4">
          <PageHeading
            title="Verified Lab Reports"
            description="View and print completed and verified laboratory test results."
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by patient name, ID or order #..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="ghost" icon="refresh" onClick={fetchReports} disabled={loading}>
              Refresh
            </Button>
          </div>

          <ContentPanel>
            <Table
              columns={columns}
              data={filteredReports}
              isLoading={loading}
              emptyMessage={searchTerm ? "No reports match your search." : "No verified reports found."}
            />
          </ContentPanel>
        </div>

        {isPreviewModalOpen && selectedOrderId && (
            <LabReportPreviewModal 
              isOpen={true}
              onClose={() => {
                setIsPreviewModalOpen(false);
                setSelectedOrderId(null);
              }}
              orderId={selectedOrderId}
            />
        )}
      </PageSurface>
    </MainLayout>
  );
};

export default LabReportsPage;
