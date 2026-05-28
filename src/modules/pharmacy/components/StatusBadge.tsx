import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = (s: string) => {
    switch (s.toUpperCase()) {
      case 'COMPLETED':
      case 'DISPENSED':
      case 'PAID': {
        return 'emerald';
      }
      case 'ACTIVE':
      case 'PENDING': {
        return 'blue';
      }
      case 'CANCELLED': {
        return 'red';
      }
      case 'DRAFT': {
        return 'slate';
      }
      default: {
        return 'slate';
      }
    }
  };

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
