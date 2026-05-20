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
