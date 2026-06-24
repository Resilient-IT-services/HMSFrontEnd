import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { pharmacyApi } from '../api/pharmacyApi';
import { MedicineResponse, PharmacyStockDTO } from '@/types/api';

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
  const [batches, setBatches] = useState<PharmacyStockDTO[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [medResponse, stockResponse] = await Promise.all([
          pharmacyApi.getMedicineById(medicineId),
          pharmacyApi.getMedicineStock({ size: 100, medicineId }) // Optimized server-side filtering
        ]);

        if (medResponse.success && medResponse.data) {
          setMedicine(medResponse.data);
        }

        if (stockResponse.success && stockResponse.data) {
          setBatches(stockResponse.data.content || []);
        }
      } catch (error) {
        console.error('Fetch Details Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [medicineId]);

  // Aggregated Calculations
  const totalStock = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  
  // Cost Price: Prioritize the purchase price from the latest batch (from backend), fallback to master
  const purchasePrice = (batches.length > 0 && batches[0].purchasePrice) 
    ? batches[0].purchasePrice 
    : (medicine?.purchasePrice || 0);

  // Selling Price: Use the price from the latest batch, fallback to master
  const currentSellingPrice = batches.length > 0 ? batches[0].price : (medicine?.sellingPrice || 0);
  
  const profitAmount = currentSellingPrice - purchasePrice;
  const profitPercentage = purchasePrice > 0 ? (profitAmount / purchasePrice) * 100 : 0;
  const inventoryValue = totalStock * purchasePrice;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Medicine Information"
      size="2xl"
    >
      <div className="bg-white min-h-[500px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analyzing product profile...</p>
          </div>
        ) : medicine ? (
          <div className="p-10 space-y-10">
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Stock</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{totalStock}</h3>
                  <p className="text-[10px] text-slate-500 font-bold mb-0.5 uppercase">Units</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Purchase Price</p>
                <div className="flex items-end gap-1">
                  <p className="text-xs font-bold text-slate-500 mb-0.5">₹</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{purchasePrice.toFixed(2)}</h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Inventory Value</p>
                <div className="flex items-end gap-1">
                  <p className="text-xs font-bold text-slate-500 mb-0.5">₹</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{inventoryValue.toLocaleString()}</h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Profit Percentage</p>
                <div className="flex items-end gap-1">
                  <h3 className={`text-2xl font-black leading-none ${profitPercentage > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                    {profitPercentage.toFixed(1)}%
                  </h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Low Stock Threshold</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{medicine.thresholdQuantity ?? medicine.reorderLevel ?? 10}</h3>
                  <p className="text-[10px] text-slate-500 font-bold mb-0.5 uppercase">Units</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Details */}
              <div className="lg:col-span-3 space-y-8">
                {/* Product Profile */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Product Information</h4>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-2 gap-px bg-slate-200">
                      {[
                        { label: 'Brand Name', value: medicine.name },
                        { label: 'Generic Name', value: medicine.genericName || 'N/A' },
                        { label: 'Composition', value: medicine.composition || 'N/A' },
                        { label: 'Manufacturer', value: medicine.manufacturer || 'N/A' },
                        { label: 'Strength', value: medicine.strength || 'N/A' },
                        { label: 'Form/Category', value: medicine.form || medicine.category || 'General' },
                        { label: 'HSN Code', value: medicine.hsnCode || 'N/A' },
                        { label: 'Tax Percentage', value: medicine.taxPercentage ? `${medicine.taxPercentage}%` : 'N/A' },
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-slate-800">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Batch Breakdown */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-xl">layers</span>
                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Active Batch Breakdown</h4>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full border border-solid border-slate-300 border-collapse text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Batch No</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Expiry</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Qty</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Cost (₹)</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Sell (₹)</th>
                          <th className="px-4 py-3 text-center align-middle font-semibold text-slate-600 bg-slate-50 border border-solid border-slate-300">Profit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batches.length === 0 ? (
                          <tr className="hover:bg-slate-50 transition-colors"><td colSpan={6} className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">No active batches in stock</div></td></tr>
                        ) : batches.map((batch) => {
                          const batchProfit = batch.price - (batch.purchasePrice || purchasePrice);
                          return (
                            <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{batch.batchNumber}</div></td>
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">
                                <span className={new Date(batch.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-600'}>
                                  {new Date(batch.expiryDate).toLocaleDateString()}
                                </span>
                              </div></td>
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">{batch.quantity}</div></td>
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">₹ {(batch.purchasePrice || purchasePrice).toFixed(2)}</div></td>
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300"><div className="flex items-center justify-center w-full">₹ {batch.price.toFixed(2)}</div></td>
                              <td className="px-4 py-3 text-center align-middle text-slate-800 border border-solid border-slate-300">
                                <div className={`flex items-center justify-center w-full text-xs font-black ${batchProfit > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                  ₹ {batchProfit.toFixed(2)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>


            </div>
          </div>
        ) : (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200">inventory_2</span>
            <p className="text-slate-500 mt-4 font-bold">Medicine profile not found</p>
          </div>
        )}

        {/* Modal Footer */}

      </div>
    </Modal>
  );
};

export default MedicineViewModal;