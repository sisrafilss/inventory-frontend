'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Company } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface CompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSuccess?: (company?: Company) => void;
  onDelete?: (company: Company) => void;
}

export function CompanyModal({
  open,
  onOpenChange,
  company = null,
  onSuccess,
  onDelete,
}: CompanyModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Suggested auto-code from backend (for new companies)
  const [suggestedCode, setSuggestedCode] = useState<string>('');

  // Code validation & duplicate check state
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch next available code for placeholder / suggestion when modal opens for create
  const fetchSuggestedCode = async () => {
    try {
      const res = await api.get<{ code: string }>('/companies/next-code');
      if (res.data?.code) {
        setSuggestedCode(res.data.code);
      }
    } catch {
      setSuggestedCode('');
    }
  };

  // Initialize or reset form when modal opens or target company changes
  useEffect(() => {
    if (open) {
      if (company) {
        setName(company.name || '');
        setCode(company.code || '');
        setDescription(company.description || '');
        setIsActive(company.isActive !== false);
        setSuggestedCode('');
      } else {
        resetForm();
        fetchSuggestedCode();
      }
      setStatusMessage(null);
      setCodeWarning(null);
      setCodeAvailable(false);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    } else {
      setStatusMessage(null);
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [open, company]);

  // Real-time debounced check when a 3-digit code is typed
  useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length !== 3) {
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsCheckingCode(false);
      return;
    }

    // If editing and code hasn't changed, skip check
    if (company && company.code === trimmed) {
      setCodeWarning(null);
      setCodeAvailable(false);
      return;
    }

    let active = true;
    setIsCheckingCode(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{
          exists: boolean;
          company: { id: string; name: string; code: string } | null;
        }>(
          `/companies/check-code/${encodeURIComponent(trimmed)}`,
          company?.id ? { excludeId: company.id } : undefined
        );
        if (!active) return;
        if (res.data?.exists) {
          setCodeWarning(
            `Code "${trimmed}" already exists (used by "${res.data.company?.name}"). Please choose another code.`
          );
          setCodeAvailable(false);
        } else {
          setCodeWarning(null);
          setCodeAvailable(true);
        }
      } catch {
        // Silently handle error
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, company]);

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setStatusMessage(null);
    setCodeWarning(null);
    setCodeAvailable(false);
  };

  // Strictly enforce 3-digit number without leading zeros
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Remove any non-digits
    val = val.replace(/\D/g, '');
    // Disallow leading zeros
    if (val.startsWith('0')) {
      val = val.replace(/^0+/, '');
    }
    // Limit to max 3 digits
    val = val.slice(0, 3);
    setCode(val);
    setCodeWarning(null);
    setCodeAvailable(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusMessage({
        text: 'Company name is required (at least 2 characters).',
        isError: true,
      });
      return;
    }

    const trimmedCode = code.trim();
    if (trimmedCode) {
      if (!/^[1-9][0-9]{2}$/.test(trimmedCode)) {
        setStatusMessage({
          text: 'Company code must be a 3-digit number (100-999) without leading zero, or left blank to auto-generate.',
          isError: true,
        });
        return;
      }
      if (codeWarning) {
        setStatusMessage({
          text: codeWarning,
          isError: true,
        });
        return;
      }
    }

    setIsSaving(true);
    setStatusMessage(null);

    // Build payload: name is required; code & description are completely optional
    const payload: {
      name: string;
      code?: string;
      description?: string;
      isActive: boolean;
    } = {
      name: trimmedName,
      isActive,
    };

    if (trimmedCode) {
      payload.code = trimmedCode;
    }
    if (description.trim()) {
      payload.description = description.trim();
    }

    try {
      if (company) {
        // Edit existing company
        const res = await api.patch<Company>(`/companies/${company.id}`, payload);
        setStatusMessage({ text: 'Company updated successfully!', isError: false });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      } else {
        // Create new company (backend will auto-assign 3-digit code if omitted)
        const res = await api.post<Company>('/companies', payload);
        setStatusMessage({
          text: `Company created successfully with code ${res.data?.code || ''}!`,
          isError: false,
        });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to save company. Please check your inputs.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!company) return;
    const confirmMsg = `Are you sure you want to delete "${company.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      await api.delete(`/companies/${company.id}`);
      if (onDelete) {
        onDelete(company);
      } else if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to delete company. It may be linked to catalog products.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  const isEdit = Boolean(company);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isSaving && !isDeleting && onOpenChange(val)}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-lg w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Top Banner Header with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/90 block -mb-0.5">
            Brand / Manufacturer Management
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none flex items-center justify-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-300" />
            {isEdit ? 'Edit Company / Brand' : 'Add New Company / Brand'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isSaving || isDeleting}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
          title="Close window"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
        {/* Top Control Bar: Refresh button & edit indicator */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#a8c2dc] dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              resetForm();
              if (!isEdit) fetchSuggestedCode();
            }}
            disabled={isSaving || isDeleting}
            className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            <span>Reset Fields</span>
          </button>

          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            {isEdit ? (
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Editing: <span className="font-bold underline">{company?.name}</span>
                {company?.code && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded text-[10px] font-mono font-bold">
                    #{company.code}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400">
                Creating New Brand Record
              </span>
            )}
          </div>
        </div>

        {/* Status / Alert Message */}
        {statusMessage && (
          <div
            className={`p-2 rounded text-xs border ${
              statusMessage.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Inner Card: Structured Desktop Grid Rows */}
        <div className="space-y-2.5 bg-[#dbe7f3] dark:bg-slate-800/60 p-3.5 rounded border border-[#b2c8dc] dark:border-slate-700 shadow-inner">
          {/* Row 1: Company Code (Optional, 3-digit number, no leading zero) */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200 pt-1.5">
              Brand / Code <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  pattern="[1-9][0-9]{2}"
                  placeholder={suggestedCode ? `Auto: ${suggestedCode}` : 'e.g. 101'}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={(e) => {
                    if (
                      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(
                        e.key
                      )
                    ) {
                      return;
                    }
                    if (e.key === '0' && code.length === 0) {
                      e.preventDefault();
                      return;
                    }
                    if (!/^\d$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  disabled={isSaving || isDeleting}
                  className={`w-36 h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border rounded-xs font-mono font-bold text-xs focus:outline-none focus:ring-1 ${
                    codeWarning
                      ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                      : codeAvailable
                      ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-700'
                      : 'border-neutral-400 dark:border-slate-600 focus:ring-emerald-600'
                  }`}
                />
                {isCheckingCode && (
                  <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    Checking...
                  </span>
                )}
                {codeAvailable && !isCheckingCode && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Available
                  </span>
                )}
              </div>

              {/* Code Warning or Helper Note */}
              {codeWarning ? (
                <div className="flex items-start gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-1 rounded border border-rose-200 dark:border-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{codeWarning}</span>
                </div>
              ) : code.length > 0 && code.length < 3 ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Code must be a 3-digit number (100–999).
                </p>
              ) : !code ? (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                  Leave blank to auto-generate 3-digit code
                  {suggestedCode ? ` (next available: ${suggestedCode})` : ''}.
                </p>
              ) : null}
            </div>
          </div>

          {/* Row 2: Company Name (Required) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
              Company Name <span className="text-red-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="e.g. RFL Plastics, Kiam, Walton"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (statusMessage) setStatusMessage(null);
                }}
                disabled={isSaving || isDeleting}
                className="w-full h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border-2 border-emerald-600 dark:border-emerald-500 rounded-xs font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Row 3: Description / Notes (Optional) */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200 pt-1">
              Description <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8">
              <textarea
                rows={2}
                placeholder="Manufacturer notes, product series, or brand origin (Optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving || isDeleting}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none font-medium"
              />
            </div>
          </div>

          {/* Row 4: Status (Active / Inactive Radio Group) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Status
            </label>
            <div className="col-span-8 flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="companyStatus"
                  checked={isActive === true}
                  onChange={() => setIsActive(true)}
                  disabled={isSaving || isDeleting}
                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                  Active Brand
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="radio"
                  name="companyStatus"
                  checked={isActive === false}
                  onChange={() => setIsActive(false)}
                  disabled={isSaving || isDeleting}
                  className="w-3.5 h-3.5 text-neutral-500 focus:ring-neutral-400 accent-neutral-600 cursor-pointer"
                />
                <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                  Inactive
                </span>
              </label>
            </div>
          </div>

          {/* Row 5: Linked Products count (if editing) */}
          {isEdit && company?._count?.products !== undefined && (
            <div className="grid grid-cols-12 items-center gap-2 pt-1 border-t border-[#c2d5e7] dark:border-slate-700 text-neutral-600 dark:text-neutral-400">
              <span className="col-span-4 text-right font-medium text-[11px]">
                Linked Products:
              </span>
              <span className="col-span-8 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">
                {company._count.products} products in catalog
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions: Save, Delete (if editing), Close */}
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-[#a8c2dc] dark:border-slate-800">
          <button
            type="submit"
            disabled={
              isSaving ||
              isDeleting ||
              !name.trim() ||
              isCheckingCode ||
              Boolean(codeWarning) ||
              (code.trim().length > 0 && code.trim().length !== 3)
            }
            className="h-7 px-5 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{isEdit ? 'Update Company' : 'Save Company'}</span>
              </>
            )}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              title="Delete this brand"
              className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isDeleting}
            className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </form>
    </Dialog>
  );
}
