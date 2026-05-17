import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="form-label">
        {label} {required && <span className="text-[var(--error)]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-500 font-bold">{error}</p>}
    </div>
  );
};
