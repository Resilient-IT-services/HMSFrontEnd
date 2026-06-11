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
import LabResultEntryModal from '../components/LabResultEntryModal';

const LabQueuePage = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING'>('PENDING');
  const [queue, setQueue] = useState<LabQueueItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [selectedOrderTestId, setSelectedOrderTestId] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      // We use the paged queue endpoint, defaulting to a large page for MVP
      const res = await labApi.getPagedQueue(activeTab, 0, 100);
      if (res.success && res.data) {
        setQueue(res.data.content);
      }
    } catch (error) {
      console.error('Failed to fetch lab queue:', error);
      triggerGlobalToast('Failed to load queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleCollectSample = async (orderTestId: string) => {
    try {
      setLoading(true);
      const res = await labApi.collectSample(orderTestId);
      if (res.success) {
        triggerGlobalToast(`Sample Collected: ${res.data}`, 'success');
        fetchQueue();
      }
    } catch (error: any) {
      console.error('Failed to collect sample:', error);
      triggerGlobalToast(error.response?.data?.message || 'Failed to collect sample', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResult = (orderTestId: string) => {
    setSelectedOrderTestId(orderTestId);
    setIsResultModalOpen(true);
  };

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
      render: (item) => (
        <Badge 
          variant={item.status === 'PENDING' ? 'orange' : item.status === 'SAMPLE_COLLECTED' ? 'blue' : 'emerald'} 
          size="sm"
        >
          {item.status.replace('_', ' ')}
        </Badge>
      )
    },
    {
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (item) => {
        if (item.status === 'PENDING') {
          return (
            <Button size="sm" onClick={() => handleCollectSample(item.orderTestId)}>
              Collect Sample
            </Button>
          );
        }
        if (item.status === 'SAMPLE_COLLECTED' || item.status === 'PROCESSING') {
          return (
            <Button size="sm" variant="secondary" onClick={() => handleEnterResult(item.orderTestId)}>
              Enter Result
            </Button>
          );
        }
        return null;
      }
    }
  ];

  return (
    <MainLayout title="Laboratory Work Queue">
      <PageSurface>
        <div className="space-y-4 py-4">
          <PageHeading
            title="Laboratory Queue"
            description="Manage sample collections and process test results."
          />

          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'PENDING' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Pending Collection
            </button>
            <button
              onClick={() => setActiveTab('SAMPLE_COLLECTED')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'SAMPLE_COLLECTED' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Ready for Processing
            </button>
          </div>

          <ContentPanel>
            <Table
              columns={columns}
              data={queue}
              isLoading={loading}
              emptyMessage={`No ${activeTab.replace('_', ' ').toLowerCase()} orders found.`}
            />
          </ContentPanel>
        </div>

        {isResultModalOpen && selectedOrderTestId && (
            <LabResultEntryModal 
              isOpen={true}
              onClose={() => {
                setIsResultModalOpen(false);
                setSelectedOrderTestId(null);
                fetchQueue();
              }}
              orderTestId={selectedOrderTestId}
            />
        )}
      </PageSurface>
    </MainLayout>
  );
};

export default LabQueuePage;
