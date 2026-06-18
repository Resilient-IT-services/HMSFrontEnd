import dayjs from '@/lib/dayjs';

export const formatCurrency = (amount: number) => {
  return `₹${(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD MMM YYYY');
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

export const formatRxNumber = (
  prescriptionNumber?: string,
  id?: string,
  createdAt?: string,
  hospitalName?: string,
): string => {
  if (prescriptionNumber) return prescriptionNumber;
  const year = createdAt
    ? new Date(createdAt).getFullYear().toString().slice(-2)
    : new Date().getFullYear().toString().slice(-2);
  const initials = hospitalName
    ? hospitalName.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('')
    : 'RX';
  return `${initials}-${year}-${(id || '').toUpperCase()}`;
};
