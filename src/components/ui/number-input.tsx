'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface PremiumNumberInputProps {
  value: number | string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  textAlign?: 'left' | 'right' | 'center';
  isFocusedHighlight?: boolean;
  allowZero?: boolean;
}

export function PremiumNumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '0.00',
  className = '',
  title,
  disabled = false,
  onFocus,
  onBlur,
  onKeyDown,
  inputRef,
  textAlign = 'left',
  isFocusedHighlight = false,
  allowZero = true,
}: PremiumNumberInputProps) {
  // If allowZero is false and value is 0, render empty string so placeholder shows.
  // Otherwise, only empty, undefined, or null should render empty string.
  const displayValue =
    value === undefined || value === null || value === '' || (!allowZero && (value === 0 || value === '0' || value === '0.00' || value === '0.0'))
      ? ''
      : String(value);

  const numStep = typeof step === 'string' ? (parseFloat(step) || 1) : step;

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return;
    const isDecimalStep = numStep < 1 || String(numStep).includes('.');
    const precision = isDecimalStep ? (String(numStep).split('.')[1]?.length || 2) : 0;

    let current: number;
    if (displayValue === '') {
      current = direction === 'up' && min !== undefined && min > 0 ? min - numStep : 0;
    } else {
      current = parseFloat(displayValue) || 0;
    }

    let next: number;
    if (direction === 'up') {
      next = Number((current + numStep).toFixed(precision));
      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;
    } else {
      next = Number((current - numStep).toFixed(precision));
      if (min !== undefined && next < min) next = min;
    }

    onChange(precision > 0 ? next.toFixed(precision) : String(next));
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        title={title}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          // Allow empty, numeric characters, and single decimal point
          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
            onChange(val);
          }
        }}
        onFocus={(e) => {
          e.target.select();
          if (onFocus) onFocus(e);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`w-full h-6 pl-2 pr-4 text-xs font-bold border border-neutral-400 dark:border-slate-600 focus:outline-none transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          isFocusedHighlight
            ? 'bg-[#ffff00] text-black ring-1 ring-amber-500'
            : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-emerald-600'
        } ${textAlign === 'right' ? 'text-right pr-4 pl-1' : 'text-left'}`}
      />
      {!disabled && (
        <div className="absolute right-0 top-0 bottom-0 w-3.5 flex flex-col border-l border-neutral-300 dark:border-slate-600 bg-neutral-100 dark:bg-slate-700/80 divide-y divide-neutral-200 dark:divide-slate-600/70 select-none">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep('up')}
            className="flex-1 flex items-center justify-center hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-neutral-500 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Increase"
          >
            <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => handleStep('down')}
            className="flex-1 flex items-center justify-center hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-neutral-500 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Decrease"
          >
            <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}

