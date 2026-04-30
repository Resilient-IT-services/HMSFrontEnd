import React from 'react';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': {
        return 'bg-blue-100 text-blue-700';
      }
      case 'DISPENSED':
      case 'COMPLETED': {
        return 'bg-green-100 text-green-700';
      }
      case 'CANCELLED': {
        return 'bg-red-100 text-red-700';
      }
      case 'LOW STOCK': {
        return 'bg-orange-100 text-orange-700';
      }
      default: {
        return 'bg-gray-100 text-gray-700';
      }
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
