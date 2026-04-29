import React from 'react';
import { PrescriptionItemDTO } from '@/types/api';

interface MedicineTableProps {
  items: PrescriptionItemDTO[];
}

const MedicineTable: React.FC<MedicineTableProps> = ({ items }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-headline-sm text-on-surface font-bold text-lg">Prescribed Medications</h2>
        <span className="text-body-sm text-gray-500 font-medium">{items.length} Items Prescribed</span>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 font-label-sm text-gray-500 uppercase text-xs font-bold tracking-wider">Medicine Name</th>
            <th className="px-6 py-3 font-label-sm text-gray-500 uppercase text-xs font-bold tracking-wider">Dosage</th>
            <th className="px-6 py-3 font-label-sm text-gray-500 uppercase text-xs font-bold tracking-wider text-center">Duration</th>
            <th className="px-6 py-3 font-label-sm text-gray-500 uppercase text-xs font-bold tracking-wider text-right">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-label-md text-on-surface font-semibold">{item.medicineName}</div>
                <div className="text-body-sm text-gray-400 text-xs">Pharma ID: {item.medicineId || 'N/A'}</div>
              </td>
              <td className="px-6 py-4 font-body-md text-on-surface text-sm">
                {item.dosage}
              </td>
              <td className="px-6 py-4 font-body-md text-on-surface text-center text-sm">
                {item.duration}
              </td>
              <td className="px-6 py-4 font-label-md text-on-surface text-right text-sm italic text-gray-500">
                {item.dosage || 'No additional notes'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-6 bg-gray-50 flex items-center justify-between text-xs text-gray-500 italic">
        * Please verify all medicines before dispensing.
      </div>
    </div>
  );
};

export default MedicineTable;
