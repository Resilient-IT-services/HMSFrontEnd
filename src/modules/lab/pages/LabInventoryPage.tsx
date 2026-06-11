'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { PageSurface } from '@/components/ui/PageSurface';
import { PageHeading } from '@/components/ui/PageHeading';
import { ContentPanel } from '@/components/ui/ContentPanel';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { labApi, LabInventoryItemDTO } from '../api/labApi';
import { triggerGlobalToast } from '@/components/ui/Toast';

const LabInventoryPage = () => {
    const [inventory, setInventory] = useState<LabInventoryItemDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await labApi.getInventory();
            if (res.success && res.data) {
                setInventory(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            triggerGlobalToast('Failed to load inventory', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchInventory();
        };
        init();
    }, [fetchInventory]);

    const handleUpdateStock = async (itemId: string, type: 'ADD' | 'REMOVE') => {
        const qty = prompt(`Enter quantity to ${type.toLowerCase()}:`);
        if (!qty || Number.isNaN(Number(qty))) return;

        try {
            setLoading(true);
            const res = await labApi.recordInventoryTransaction(itemId, Number(qty), type);
            if (res.success) {
                triggerGlobalToast('Stock updated successfully', 'success');
                fetchInventory();
            }
        } catch (error) {
            console.error('Failed to update stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<LabInventoryItemDTO>[] = [
        {
            header: 'Item Name',
            render: (item) => (
                <div>
                    <p className="text-sm font-bold text-slate-800">{item.itemName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.itemCode}</p>
                </div>
            )
        },
        {
            header: 'Stock Level',
            render: (item) => {
                const isLow = (item.availableQty || 0) <= (item.reorderLevel || 0);
                return (
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${isLow ? 'text-orange-600' : 'text-slate-800'}`}>
                            {item.availableQty || 0} {item.unit}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Status',
            render: (item) => {
                const isLow = (item.availableQty || 0) <= (item.reorderLevel || 0);
                return (
                    <Badge 
                        variant={isLow ? 'orange' : 'emerald'} 
                        size="sm"
                    >
                        {isLow ? 'LOW STOCK' : 'IN STOCK'}
                    </Badge>
                );
            }
        },
        {
            header: 'Action',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (item) => (
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateStock(item.id!, 'ADD')}>
                        Add Stock
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateStock(item.id!, 'REMOVE')}>
                        Consume
                    </Button>
                </div>
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
                            <h4 className="text-2xl font-black text-orange-600">
                                {inventory.filter(i => (i.availableQty || 0) <= (i.reorderLevel || 0)).length}
                            </h4>
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
                </div>
            </PageSurface>
        </MainLayout>
    );
};

export default LabInventoryPage;
