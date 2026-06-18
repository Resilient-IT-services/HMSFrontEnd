'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { pharmacyApi } from '../api/pharmacyApi';
import { QuickPharmacySaleResponse, PageResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/utils/formatters';
import { invoiceService } from '@/services/invoiceService';
import { Button } from '@/components/ui/Button';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { SearchInput } from '@/components/ui/SearchInput';
import dayjs from 'dayjs';

const BillingHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PageResponse<QuickPharmacySaleResponse> | null>(null);
  const [search, setSearch] = useState('');
  const [saleType, setSaleType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: pageSize,
        search: search.trim() || undefined,
        saleType: saleType === 'ALL' ? undefined : saleType,
        sort: 'createdAt,desc'
      };
      const response = await pharmacyApi.getSales(params);
      if (response.success) {
        setData(response.data || null);
      }
    } catch (error) {
      console.error('Failed to fetch sales history:', error);
      triggerGlobalToast('Failed to load billing history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, saleType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  const handlePrint = async (sale: QuickPharmacySaleResponse) => {
    if (!sale.invoiceId) {
      triggerGlobalToast('Invoice ID not found', 'error');
      return;
    }
    try {
      triggerGlobalToast('Generating invoice...', 'info');
      const blob = await invoiceService.exportPdf(sale.invoiceId, 'PHARMACY');
      const url = globalThis.URL.createObjectURL(blob);
      globalThis.window.open(url, '_blank');
      // Delay revoking to ensure the new tab can load it
      setTimeout(() => globalThis.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Print Error:', error);
      triggerGlobalToast('Failed to generate invoice', 'error');
    }
  };

  const columns: Column<QuickPharmacySaleResponse>[] = [
    {
      header: 'Date & Time',
      render: (item: QuickPharmacySaleResponse) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{dayjs(item.createdAt).format('DD MMM YYYY')}</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">{dayjs(item.createdAt).format('hh:mm A')}</span>
        </div>
      )
    },
    {
      header: 'Invoice #',
      render: (item: QuickPharmacySaleResponse) => <span className="font-black text-slate-900">{item.invoiceNumber || item.saleNumber}</span>
    },
    {
      header: 'Customer / Patient',
      render: (item: QuickPharmacySaleResponse) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{item.customerName || 'N/A'}</span>
          {item.customerPhone && <span className="text-[10px] text-slate-400 font-medium">{item.customerPhone}</span>}
          {item.patientCode && <span className="text-[10px] text-orange-600 font-bold uppercase">ID: {item.patientCode}</span>}
        </div>
      )
    },
    {
      header: 'Sale Type',
      render: (item: QuickPharmacySaleResponse) => (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
          item.saleType === 'WALKIN' 
            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {item.saleType}
        </span>
      )
    },
    {
      header: 'Items',
      render: (item: QuickPharmacySaleResponse) => <span className="font-medium text-slate-600">{item.items?.length || 0} items</span>
    },
    {
      header: 'Doctor',
      render: (item: QuickPharmacySaleResponse) => <span className="text-sm font-medium text-slate-600">{item.doctorName || item.externalDoctorName || 'Self'}</span>
    },
    {
      header: 'Amount',
      render: (item: QuickPharmacySaleResponse) => <span className="font-black text-slate-900">{formatCurrency(item.totalAmount)}</span>
    },
    {
      header: 'Actions',
      render: (item: QuickPharmacySaleResponse) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon="print"
            onClick={() => handlePrint(item)}
            className="text-slate-400 hover:text-orange-600"
          />
        </div>
      )
    }
  ];

  return (
    <MainLayout title="Pharmacy Billing History">
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="py-2 md:py-4 space-y-4">
          <PageHeading
            title="Billing History"
            description="View and manage all pharmacy sales including Walk-ins and Visit prescriptions."
          >
            <Button
              variant="secondary"
              icon="refresh"
              onClick={fetchSales}
              disabled={loading}
            >
              Refresh Data
            </Button>
          </PageHeading>

          <ContentPanel
            className="mb-4"
            toolbar={(
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                  <div className="w-full max-w-sm">
                    <SearchInput
                      placeholder="Search by Invoice, Name, Phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={saleType}
                    onChange={(e) => setSaleType(e.target.value)}
                    className="min-w-[160px] cursor-pointer rounded-xl border-none bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition-colors hover:bg-slate-50"
                  >
                    <option value="ALL">All Sales</option>
                    <option value="WALKIN">Walk-in Only</option>
                    <option value="VISIT">Prescriptions Only</option>
                  </select>
                </div>
              </div>
            )}
          >
            <Table
              columns={columns}
              data={data?.content || []}
              isLoading={loading}
              emptyMessage="No billing records found matching your criteria."
            />

            <Pagination
              page={page}
              totalElements={data?.totalElements || 0}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              label="bills"
            />
          </ContentPanel>
        </div>
      </PageSurface>
    </MainLayout>
  );
};

export default BillingHistoryPage;
