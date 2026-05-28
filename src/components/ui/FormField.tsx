import React from 'react';

interface FormFieldProps {
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = '',
  icon,
  helperText
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="form-label flex items-center gap-1">
        {icon && <span className="material-symbols-outlined text-[16px] text-slate-400">{icon}</span>}
        <div className="flex-1 w-full">{label}</div>
        {required && <span className="text-[var(--error)]">*</span>}
      </label>
      {children}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500 font-medium">{helperText}</p>}
      {error && <p className="mt-1 text-sm text-red-500 font-bold">{error}</p>}
    </div>
  );
};
