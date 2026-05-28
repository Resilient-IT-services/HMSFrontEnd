import React from 'react';
import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps {
  status: string;
}

const STATUS_VARIANTS: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  ACTIVE: 'blue',
  COMPLETED: 'emerald',
  DISPENSED: 'emerald',
  CANCELLED: 'red',
  EXPIRED: 'red',
  PENDING: 'orange',
  PAYMENT_PENDING: 'orange',
  PRESCRIPTION_FINALIZED: 'purple',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = status || 'ACTIVE';
  const label = normalizedStatus.replace(/_/g, ' ');

  return (
    <Badge variant={STATUS_VARIANTS[normalizedStatus] || 'slate'} size="sm">
      {label}
    </Badge>
  );
};

export default StatusBadge;
