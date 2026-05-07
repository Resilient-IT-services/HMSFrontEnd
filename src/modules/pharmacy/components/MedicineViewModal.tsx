// MedicineViewModal.tsx
// Clean Enterprise UI Version

'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineResponse } from '@/types/api';
import LoadingSkeleton from './LoadingSkeleton';

interface MedicineViewModalProps {
  medicineId: string;
  onClose: () => void;
}

const MedicineViewModal: React.FC<MedicineViewModalProps> = ({
                                                               medicineId,
                                                               onClose
                                                             }) => {
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<MedicineResponse | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        const response = await pharmacyApi.getMedicineById(medicineId);

        if (response.success && response.data) {
          setMedicine(response.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [medicineId]);

  return (
      <Modal
          isOpen={true}
          onClose={onClose}
          title="Medicine Information"
          maxWidth="max-w-5xl"
      >
        <div className="bg-white rounded-xl overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Medicine Profile
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Complete medicine and inventory information
              </p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-700">
              medication
            </span>
            </div>

          </div>

          {loading ? (
              <div className="py-16">
                <LoadingSkeleton />
              </div>
          ) : medicine ? (
              <div className="p-6 space-y-6">

                {/* Top Summary */}
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-wrap justify-between gap-5">

                  <div>
                    <div className="flex items-center gap-3 mb-3">

                  <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-medium">
                    {medicine.form || medicine.category || 'General'}
                  </span>

                      <span className="text-xs text-slate-500">
                    SKU: {medicine.id.split('-')[0]}
                  </span>

                    </div>

                    <h3 className="text-3xl font-semibold text-slate-900">
                      {medicine.name}
                    </h3>

                    <p className="text-sm text-slate-500 mt-2">
                      {medicine.composition || 'No composition available'}
                    </p>
                  </div>

                  <div className="min-w-[180px] bg-white border border-slate-200 rounded-xl p-5 text-right">

                    <p className="text-xs text-slate-500 mb-2">
                      Current Stock
                    </p>

                    <p className="text-3xl font-semibold text-slate-900">
                      {medicine.currentStock || 0}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Units Available
                    </p>

                  </div>

                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left */}
                  <div className="lg:col-span-3 space-y-6">

                    {/* Basic Info */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">

                      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h4 className="text-sm font-semibold text-slate-800">
                          Medicine Information
                        </h4>
                      </div>

                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Generic Name
                          </p>

                          <p className="text-sm font-medium text-slate-800">
                            {medicine.genericName || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Manufacturer
                          </p>

                          <p className="text-sm font-medium text-slate-800">
                            {medicine.manufacturer || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Strength
                          </p>

                          <p className="text-sm font-medium text-slate-800">
                            {medicine.strength || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">
                            Schedule Type
                          </p>

                          <span className="inline-flex px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {medicine.scheduledType || medicine.scheduleDrug || 'UNSCHEDULED'}
                      </span>
                        </div>

                      </div>

                    </div>

                    {/* Storage */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">

                      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h4 className="text-sm font-semibold text-slate-800">
                          Pricing Details
                        </h4>
                      </div>

                      <div className="p-5 space-y-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Selling Price
                          </p>

                          <p className="text-lg font-semibold text-slate-900">
                            ₹ {medicine.sellingPrice?.toFixed(2) || '0.00'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Purchase Price
                          </p>

                          <p className="text-lg font-semibold text-slate-900">
                            ₹ {medicine.purchasePrice?.toFixed(2) || '0.00'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Gross Margin
                          </p>

                          <p className="text-lg font-semibold text-green-600">
                            {medicine.purchasePrice && medicine.sellingPrice
                                ? (
                                ((medicine.sellingPrice - medicine.purchasePrice) /
                                    medicine.purchasePrice) *
                                100
                            ).toFixed(1) + '%'
                                : '0.0%'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Reorder Level
                          </p>

                          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        {medicine.reorderLevel || 50} Units
                      </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500">
                            Inventory Value
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Based on purchase price
                          </p>
                          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        ₹{' '}
                            {(
                                (medicine.currentStock || 0) *
                                (medicine.purchasePrice || 0)
                            ).toLocaleString()}
                      </span>

                        </div>


                      </div>

                    </div>

                  </div>



                  </div>




              </div>
          ) : (
              <div className="py-16 text-center">

            <span className="material-symbols-outlined text-5xl text-slate-300">
              inventory_2
            </span>

                <p className="text-slate-500 mt-4">
                  Medicine not found
                </p>

              </div>
          )}

        </div>
      </Modal>
  );
};

export default MedicineViewModal;