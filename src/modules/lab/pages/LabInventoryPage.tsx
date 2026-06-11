'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ReagentItem {
    id: string;
    name: string;
    category: string;
    stock: number;
    unit: string;
    batchNo: string;
    expiryDate: string;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRED';
}

const MOCK_INVENTORY: ReagentItem[] = [
    { id: '1', name: 'Glucose Reagent', category: 'Biochemistry', stock: 50, unit: 'Kits', batchNo: 'BATCH-001', expiryDate: '2026-12-01', status: 'IN_STOCK' },
    { id: '2', name: 'Cholesterol Reagent', category: 'Biochemistry', stock: 5, unit: 'Kits', batchNo: 'BATCH-002', expiryDate: '2026-08-15', status: 'LOW_STOCK' },
    { id: '3', name: 'WBC Diluting Fluid', category: 'Hematology', stock: 20, unit: 'Bottles', batchNo: 'BATCH-003', expiryDate: '2025-05-20', status: 'EXPIRED' },
    { id: '4', name: 'RBC Diluting Fluid', category: 'Hematology', stock: 15, unit: 'Bottles', batchNo: 'BATCH-004', expiryDate: '2026-10-10', status: 'IN_STOCK' },
    { id: '5', name: 'Urine Test Strips', category: 'Urinalysis', stock: 100, unit: 'Packs', batchNo: 'BATCH-005', expiryDate: '2027-01-01', status: 'IN_STOCK' },
];

const LabInventoryPage = () => {
    const [inventory] = useState<ReagentItem[]>(MOCK_INVENTORY);
    const [loading] = useState(false);

    const columns: Column<ReagentItem>[] = [
        {
            header: 'Item Name',
            render: (item) => (
                <div>
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p>
                </div>
            )
        },
        {
            header: 'Stock Level',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${item.status === 'LOW_STOCK' ? 'text-orange-600' : item.status === 'EXPIRED' ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.stock} {item.unit}
                    </span>
                </div>
            )
        },
        {
            header: 'Batch / Expiry',
            render: (item) => (
                <div>
                    <p className="text-xs font-bold text-slate-600">{item.batchNo}</p>
                    <p className={`text-[10px] font-bold ${item.status === 'EXPIRED' ? 'text-red-500' : 'text-slate-400'}`}>
                        Exp: {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                </div>
            )
        },
        {
            header: 'Status',
            render: (item) => (
                <Badge 
                    variant={item.status === 'IN_STOCK' ? 'emerald' : item.status === 'LOW_STOCK' ? 'orange' : 'red'} 
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
            render: () => (
                <Button size="sm" variant="ghost">
                    Update Stock
                </Button>
            )
        }
    ];

    return (
        <MainLayout title="Laboratory Inventory">
            <PageSurface>
                <div className="space-y-6 py-4">
                    <PageHeading
                        title="Reagent & Supply Inventory"
                        description="Monitor stock levels, batch details, and expiry dates for lab materials."
                    />

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-4 border-l-4 border-l-emerald-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Items</p>
                            <h4 className="text-2xl font-black text-slate-800">{inventory.length}</h4>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-orange-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Alert</p>
                            <h4 className="text-2xl font-black text-orange-600">{inventory.filter(i => i.status === 'LOW_STOCK').length}</h4>
                        </Card>
                        <Card className="p-4 border-l-4 border-l-red-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expired Items</p>
                            <h4 className="text-2xl font-black text-red-600">{inventory.filter(i => i.status === 'EXPIRED').length}</h4>
                        </Card>
                    </div>

                    <ContentPanel>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Current Stock Status</h3>
                            <Button size="sm" icon="add">Add New Reagent</Button>
                        </div>
                        <Table
                            columns={columns}
                            data={inventory}
                            isLoading={loading}
                        />
                    </ContentPanel>

                    <Card className="p-6 bg-blue-50 border-blue-100 border-2">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-blue-600">tips_and_updates</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight mb-1">Inventory Management Tip</h4>
                                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                                    Regularly check for items expiring within the next 30 days to optimize reagent usage and minimize waste. 
                                    Always update stock levels immediately after a new batch is received.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </PageSurface>
        </MainLayout>
    );
};

export default LabInventoryPage;
