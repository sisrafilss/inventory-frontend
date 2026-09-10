'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Truck,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  MapPin,
  Mail,
  DollarSign,
} from 'lucide-react';
import { Supplier } from '@/lib/types';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';

export interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSuccess?: (supplier?: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
}

export function SupplierModal({
  open,
  onOpenChange,
  supplier = null,
  onSuccess,
  onDelete,
}: SupplierModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (supplier) {
        setName(supplier.name || '');
        setCompanyName(supplier.companyName || '');
        setPhone(supplier.phone || '');
        setEmail(supplier.email || '');
        setAddress(supplier.address || '');
        setOpeningDue(Number(supplier.openingDue) || 0);
        setIsActive(supplier.isActive !== false);
      } else {
        resetForm();
      }
      setStatusMessage(null);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    } else {
      setStatusMessage(null);
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [open, supplier]);

  const resetForm = () => {
    setName('');
    setCompanyName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningDue(0);
    setIsActive(true);
    setStatusMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusMessage({
        text: 'Supplier name is required (at least 2 characters).',
        isError: true,
      });
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setStatusMessage({
        text: 'Phone number is required.',
        isError: true,
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      name: trimmedName,
      companyName: companyName.trim() || undefined,
      phone: trimmedPhone,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      openingDue: Number(openingDue) || 0,
      isActive,
    };

    try {
      if (supplier) {
        const res = await api.patch<Supplier>(`/parties/suppliers/${supplier.id}`, payload);
        setStatusMessage({ text: 'Supplier updated successfully!', isError: false });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      } else {
        const res = await api.post<Supplier>('/parties/suppliers', payload);
        setStatusMessage({ text: 'Supplier registered successfully!', isError: false });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to save supplier. Please check inputs.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;
    const confirmMsg = `Are you sure you want to delete supplier "${supplier.name}"?\n\nIf this vendor has past purchase bills or payment history, deletion will be blocked to maintain audit trails.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      await api.delete(`/parties/suppliers/${supplier.id}`);
      if (onDelete) onDelete(supplier);
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to delete supplier.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;
  const isEdit = Boolean(supplier);

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
            Vendor & Accounts Payable Registry
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none flex items-center justify-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-300" />
            {isEdit ? 'Edit Supplier / Vendor' : 'Add New Supplier / Vendor'}
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

      {/* Form Body */}
      <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
        {/* Top Control Bar: Reset & Info */}
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
                Editing: <span className="font-bold underline">{supplier?.name}</span>
                {supplier?.currentDue !== undefined && (
                  <span className="ml-2 font-mono text-rose-700 dark:text-rose-400 font-bold">
                    [Due: ৳{Number(supplier.currentDue).toLocaleString()}]
                  </span>
                )}
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400">
                Registering New Vendor
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
            <div className="flex items-center gap-1.5">
              {statusMessage.isError ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* Inner Card: Structured Desktop Grid Rows */}
        <div className="space-y-2.5 bg-[#dbe7f3] dark:bg-slate-800/60 p-3.5 rounded border border-[#b2c8dc] dark:border-slate-700 shadow-inner">
          {/* Supplier Name */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Supplier Name <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="e.g. Md. Rafiqul Islam / Abir Enterprise"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 font-semibold"
              />
            </div>
          </div>

          {/* Company / Agency Represented */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Company / Agency <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8">
              <input
                type="text"
                placeholder="e.g. RFL Plastics Dealer / Square Pharma"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Phone Number <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <input
                type="text"
                required
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Email Address <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8">
              <input
                type="email"
                placeholder="vendor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Office / Shop Address */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200 pt-1">
              Office / Address
            </label>
            <div className="col-span-8">
              <textarea
                rows={2}
                placeholder="Shop #, Market/Plaza, City, Thana"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 resize-none"
              />
            </div>
          </div>

          {/* Opening Due (৳) - Only editable on new registration */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              {isEdit ? 'Opening Due (৳)' : 'Previous Due (৳)'}
            </label>
            <div className="col-span-8">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={openingDue === 0 ? '' : openingDue}
                onChange={(e) => setOpeningDue(parseFloat(e.target.value) || 0)}
                disabled={isSaving || isEdit}
                className={`w-full px-2 py-1 border rounded-xs text-xs focus:outline-none font-mono ${
                  isEdit
                    ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 border-neutral-300 dark:border-slate-700 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border-neutral-400 dark:border-slate-600 focus:ring-1 focus:ring-[#006400]'
                }`}
              />
              {isEdit && (
                <span className="text-[10px] text-neutral-500 italic mt-0.5 block">
                  Opening due is locked after creation. Use Payment action to record balances.
                </span>
              )}
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="grid grid-cols-12 items-center gap-2 pt-1 border-t border-[#b2c8dc] dark:border-slate-700">
            <div className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Vendor Status
            </div>
            <div className="col-span-8">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                  className="rounded-xs text-[#006400] focus:ring-[#006400] w-3.5 h-3.5"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Active Vendor Account
                </span>
                <span className="text-[10px] text-neutral-500">
                  (Available for purchase orders)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#a8c2dc] dark:border-slate-800">
          <div>
            {isEdit && isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting}
                className="h-7 px-3 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-400 dark:border-rose-700 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
              className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="h-7 px-4 bg-[#006400] hover:bg-emerald-800 text-white font-bold text-xs rounded-xs border border-[#004d00] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Update Supplier' : 'Save Supplier'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

