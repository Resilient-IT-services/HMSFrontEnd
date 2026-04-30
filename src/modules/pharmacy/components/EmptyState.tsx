import React from 'react';

interface EmptyStateProps {
  message: string;
  icon?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon = 'search_off' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
      <span className="material-symbols-outlined text-6xl mb-4">{icon}</span>
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
};

export default EmptyState;
