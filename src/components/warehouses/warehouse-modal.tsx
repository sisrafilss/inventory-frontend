'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Check,
} from 'lucide-react';
import { Warehouse } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface WarehouseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  onSuccess?: (warehouse?: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
}

export function WarehouseModal({
  open,
  onOpenChange,
  warehouse = null,
  onSuccess,
  onDelete,
}: WarehouseModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Auto-code suggestion & validation state
  const [suggestedCode, setSuggestedCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch next suggested warehouse code
  const fetchSuggestedCode = async () => {
    try {
      const res = await api.get<{ code: string }>('/warehouses/next-code');
      if (res.data?.code) {
        setSuggestedCode(res.data.code);
      }
    } catch {
      setSuggestedCode('WA-101');
    }
  };

  useEffect(() => {
    if (open) {
      if (warehouse) {
        setName(warehouse.name || '');
        setCode(warehouse.code || '');
        setAddress(warehouse.address || '');
        setIsDefault(Boolean(warehouse.isDefault));
        setIsActive(warehouse.isActive !== false);
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
  }, [open, warehouse]);

  // Real-time debounced check when a warehouse code is entered
  useEffect(() => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsCheckingCode(false);
      return;
    }

    // If editing and code hasn't changed, skip check
    if (warehouse && warehouse.code?.trim().toUpperCase() === trimmed) {
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsCheckingCode(false);
      return;
    }

    let active = true;
    setIsCheckingCode(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{
          exists: boolean;
          warehouse: { id: string; name: string; code: string } | null;
        }>(
          `/warehouses/check-code/${encodeURIComponent(trimmed)}`,
          warehouse?.id ? { excludeId: warehouse.id } : undefined
        );
        if (!active) return;
        if (res.data?.exists) {
          setCodeWarning(
            `Code "${trimmed}" already exists (used by "${res.data.warehouse?.name}").`
          );
          setCodeAvailable(false);
        } else {
          setCodeWarning(null);
          setCodeAvailable(true);
        }
      } catch {
        // Ignore network check failure
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, warehouse]);

  const resetForm = () => {
    setName('');
    setCode('');
    setAddress('');
    setIsDefault(false);
    setIsActive(true);
    setStatusMessage(null);
    setCodeWarning(null);
    setCodeAvailable(false);
    fetchSuggestedCode();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeWarning) {
      setStatusMessage({ text: codeWarning, isError: true });
      return;
    }
    if (!name.trim()) {
      setStatusMessage({ text: 'Please enter a valid warehouse name.', isError: true });
      nameInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      address: address.trim() || undefined,
      isDefault,
      isActive,
    };

    try {
      if (warehouse) {
        // Update existing
        const res = await api.patch<{ data: Warehouse; message?: string }>(
          `/warehouses/${warehouse.id}`,
          payload
        );
        const updated = (res as any).data || res;
        setStatusMessage({
          text: `Warehouse "${name}" updated successfully!`,
          isError: false,
        });
        if (onSuccess) onSuccess(updated);
        setTimeout(() => onOpenChange(false), 250);
      } else {
        // Create new
        const res = await api.post<{ data: Warehouse; message?: string }>('/warehouses', payload);
        const created = (res as any).data || res;
        setStatusMessage({
          text: `Warehouse "${name}" created successfully!`,
          isError: false,
        });
        if (onSuccess) onSuccess(created);
        setTimeout(() => onOpenChange(false), 250);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to save warehouse. Please check your inputs.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!warehouse) return;
    const confirmMsg = `Are you sure you want to delete warehouse "${warehouse.name}"?\n\nIf this location contains active inventory or past transaction records, delete will be blocked to protect data integrity.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      await api.delete(`/warehouses/${warehouse.id}`);
      if (onDelete) {
        onDelete(warehouse);
      } else if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to delete warehouse. Consider marking it as Inactive instead.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  const isEdit = Boolean(warehouse);

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
            Storage & Multi-Location Registry
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none flex items-center justify-center gap-1.5">
            <WarehouseIcon className="w-4 h-4 text-emerald-300" />
            {isEdit ? 'Edit Warehouse / Godown' : 'Add New Warehouse / Godown'}
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
        {/* Top Control Bar: Reset button & edit indicator */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#a8c2dc] dark:border-slate-800">
          <button
            type="button"
            onClick={resetForm}
            disabled={isSaving || isDeleting}
            className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            <span>Reset Fields</span>
          </button>

          <div className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            {isEdit ? (
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Editing: <span className="font-bold underline">{warehouse?.name}</span>
                {warehouse?.code && ` [${warehouse.code}]`}
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400 italic">
                Mode: New Godown Entry
              </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-2 rounded-xs border text-xs flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                : 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
            }`}
          >
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body Card */}
        <div className="bg-[#dbe7f3] dark:bg-slate-800/60 p-3.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 space-y-3 shadow-inner">
          {/* System ID & Godown Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                System ID
              </label>
              <input
                type="text"
                disabled
                value={isEdit ? warehouse?.id.slice(0, 8).toUpperCase() : 'AUTO-ASSIGNED'}
                className="w-full px-2.5 py-1.5 bg-[#e4ecf5] dark:bg-slate-900/60 border border-[#a8c2dc] dark:border-slate-700 rounded-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 text-xs cursor-not-allowed select-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-neutral-800 dark:text-neutral-200">
                  Godown Code <span className="text-[10px] font-normal text-neutral-500">(Optional)</span>
                </label>
                {isCheckingCode ? (
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" /> Checking...
                  </span>
                ) : codeAvailable ? (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Available
                  </span>
                ) : null}
              </div>
              <input
                type="text"
                placeholder={suggestedCode ? `Auto: ${suggestedCode}` : 'e.g. WA-101'}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isSaving || isDeleting}
                className={`w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-xs text-xs font-mono font-bold focus:outline-none focus:ring-1 uppercase ${
                  codeWarning
                    ? 'border-rose-500 focus:ring-rose-500 text-rose-700 dark:text-rose-400'
                    : codeAvailable
                    ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-400 dark:border-slate-600 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100'
                }`}
              />
              {codeWarning ? (
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">
                  {codeWarning}
                </span>
              ) : !code ? (
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block mt-0.5 italic">
                  Auto-assigned as <strong>{suggestedCode || 'WA-101'}</strong> if left blank
                </span>
              ) : null}
            </div>
          </div>

          {/* Godown Name */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              Godown / Warehouse Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="e.g. Main Godown, Dhaka Central Hub, Factory Depot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving || isDeleting}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
            />
          </div>

          {/* Location / Physical Address */}
          <div>
            <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
              Location / Physical Address <span className="text-[10px] font-normal text-neutral-500">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Shiromoni Bazar, Khulna"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSaving || isDeleting}
                className="w-full pl-7 pr-2.5 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
              />
              <MapPin className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-2" />
            </div>
          </div>

          {/* Default Status & Active Status */}
          <div className="pt-1 border-t border-[#b2c8dc] dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={isSaving || isDeleting}
                className="w-3.5 h-3.5 text-[#006400] border-neutral-400 rounded-xs focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1">
                Default Godown (Primary for Sales & Restocking)
                {isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
              </span>
            </label>

            <div className="flex items-center gap-3">
              <span className="font-bold text-neutral-700 dark:text-neutral-300 text-xs">Status:</span>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="radio"
                  name="modal-status"
                  checked={isActive}
                  onChange={() => setIsActive(true)}
                  disabled={isSaving || isDeleting}
                  className="w-3.5 h-3.5 text-[#006400] border-neutral-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="font-semibold text-emerald-800 dark:text-emerald-400 text-xs">Active</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="radio"
                  name="modal-status"
                  checked={!isActive}
                  onChange={() => setIsActive(false)}
                  disabled={isSaving || isDeleting}
                  className="w-3.5 h-3.5 text-rose-600 border-neutral-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="font-semibold text-neutral-600 dark:text-neutral-400 text-xs">Inactive</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#a8c2dc] dark:border-slate-800">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="h-7 px-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500 dark:border-rose-700 rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Godown</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
              className="h-7 px-3.5 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="h-7 px-4 bg-[#006400] hover:bg-emerald-800 text-white font-bold text-xs rounded-xs border border-[#004d00] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isEdit ? 'Update Warehouse' : 'Save Warehouse'}</span>
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

