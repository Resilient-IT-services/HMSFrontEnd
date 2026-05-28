'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
}

interface MobileSelectorProps {
  label: string;
  options: Option[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface SelectionOverlayProps {
  isOpen: boolean;
  label: string;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filteredOptions: Option[];
  value: string | number;
  onSelect: (optionId: string | number) => void;
  onClose: () => void;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  isOpen,
  label,
  searchTerm,
  setSearchTerm,
  filteredOptions,
  value,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col animate-in slide-in-from-right duration-300 md:hidden">
      <header className="sticky top-0 z-10 bg-white border-b border-outline-variant px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 active:scale-95 transition-transform text-secondary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-headline-md text-on-surface">{label}</h1>
        </div>
        <button 
          type="button"
          onClick={() => setSearchTerm('')}
          className="text-primary font-label-md px-3 py-2 active:scale-95 transition-transform"
        >
          Reset
        </button>
      </header>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
          <input 
            className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition-all placeholder:text-secondary/50 font-body-md" 
            placeholder={`Search ${label.toLowerCase()}...`}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <p className="text-secondary font-label-sm uppercase tracking-wider px-1">
            Available Options ({filteredOptions.length})
          </p>
          
          {filteredOptions.map((option) => (
            <label key={option.id} className="group relative block cursor-pointer">
              <input 
                type="radio" 
                name="mobile-selector-option" 
                className="sr-only"
                checked={String(option.id) === String(value)}
                onChange={() => onSelect(option.id)}
              />
              <div className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all active:scale-[0.98] ${
                String(option.id) === String(value) 
                  ? 'border-primary-container bg-orange-50/30 ring-1 ring-primary' 
                  : 'border-outline-variant'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    String(option.id) === String(value) ? 'bg-primary-fixed' : 'bg-surface-container'
                  }`}>
                    <span className={`material-symbols-outlined ${
                      String(option.id) === String(value) ? 'text-primary' : 'text-secondary'
                    }`}>
                      {option.icon || 'list'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface">{option.name}</h3>
                    {option.description && <p className="text-body-sm text-secondary">{option.description}</p>}
                  </div>
                </div>
                <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${
                  String(option.id) === String(value) ? 'border-primary bg-primary' : 'border-outline-variant'
                }`}>
                  {String(option.id) === String(value) && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </label>
          ))}

          {filteredOptions.length === 0 && (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">search_off</span>
              <p className="text-secondary font-body-md">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MobileSelector: React.FC<MobileSelectorProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const selectedOption = options.find(o => String(o.id) === String(value));

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionId: string | number) => {
    onChange(String(optionId));
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Desktop View - Fallback to standard select or a nice dropdown */}
      <div className="hidden md:block">
        <select 
          className={`form-input w-full ${error ? 'border-error ring-1 ring-error/20' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Mobile View - The "Empty Space" / Trigger */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl text-left transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'active:bg-gray-50'
          } ${error ? 'border-error ring-1 ring-error/20' : 'border-outline-variant'}`}
        >
          <div className="flex items-center gap-3">
            {selectedOption?.icon && (
              <span className="material-symbols-outlined text-primary">{selectedOption.icon}</span>
            )}
            <div>
              {selectedOption ? (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                  <p className="font-headline-sm text-on-surface leading-tight">{selectedOption.name}</p>
                </>
              ) : (
                <p className="font-body-md text-secondary">{placeholder}</p>
              )}
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">expand_more</span>
        </button>
      </div>

      {mounted && createPortal(
        <SelectionOverlay 
          isOpen={isOpen}
          label={label}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredOptions={filteredOptions}
          value={value}
          onSelect={handleSelect}
          onClose={handleClose}
        />, 
        globalThis.document.body
      )}
    </div>
  );
};
