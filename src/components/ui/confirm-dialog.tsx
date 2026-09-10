'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogDetail {
  label: string;
  value: string;
  color?: string;
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | null | undefined;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'success' | 'danger';
  isLoading?: boolean;
  loadingText?: string;
  details?: ConfirmDialogDetail[];
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Yes',
  cancelText = 'No',
  variant = 'success',
  isLoading = false,
  loadingText,
  details,
}: ConfirmDialogProps) {
  const isSuccess = variant === 'success';

  const headerClass = isSuccess
    ? 'bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center gap-2 text-white'
    : 'bg-[#800000] dark:bg-rose-950 py-1.5 px-4 border-b border-[#4d0000] dark:border-rose-900 flex items-center gap-2 text-white';

  const confirmButtonClass = isSuccess
    ? 'h-7 px-6 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-800 font-bold text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors'
    : 'h-7 px-6 bg-red-600 hover:bg-red-700 text-white border border-red-800 font-bold text-xs shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      closeOnBackdropClick={!isLoading}
      className="p-0 max-w-sm w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className={headerClass}>
        {isSuccess ? (
          <HelpCircle className="w-4 h-4 text-lime-300" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-rose-300" />
        )}
        <span className="font-bold text-sm tracking-wide">{title}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 text-neutral-900 dark:text-neutral-100">
        {description && (
          <p className="text-xs font-bold">{description}</p>
        )}

        {/* Optional details table */}
        {details && details.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 p-2 text-xs font-mono space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">{detail.label}</span>
                <span className={`font-bold ${detail.color || 'text-neutral-900 dark:text-neutral-100'}`}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-1">
          {cancelText !== '' && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold text-xs shadow-sm disabled:opacity-50 transition-colors text-neutral-900 dark:text-neutral-100"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClass}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {loadingText || confirmText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
