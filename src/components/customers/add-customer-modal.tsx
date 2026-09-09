'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { UserPlus, X, Loader2, AlertCircle, Phone, MapPin, User } from 'lucide-react';
import { Customer } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated: (customer: Customer) => void;
  initialSearch?: string;
}

export function AddCustomerModal({
  open,
  onOpenChange,
  onCustomerCreated,
  initialSearch = '',
}: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize or pre-fill when opened
  useEffect(() => {
    if (open) {
      const trimmed = initialSearch.trim();
      // If initial search looks like a phone number (mostly digits)
      if (/^[0-9+-\s()]{4,}$/.test(trimmed)) {
        setPhone(trimmed);
        setName('');
      } else {
        setName(trimmed);
        setPhone('');
      }
      setAddress('');
      setError(null);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setError(null);
      setIsSaving(false);
    }
  }, [open, initialSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Customer name is required (at least 2 characters).');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 5) {
      setError('A valid phone number is required (at least 5 characters).');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post<Customer>('/parties/customers', {
        name: trimmedName,
        phone: trimmedPhone,
        address: address.trim() || undefined,
        openingDue: 0,
        isActive: true,
      });

      if (res.data) {
        onCustomerCreated(res.data);
        onOpenChange(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create customer. Please check if phone already exists.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isSaving && onOpenChange(val)}
      draggable={true}
      closeOnBackdropClick={!isSaving}
      zIndex="z-[85]"
      className="p-0 max-w-md w-full border-2 border-emerald-700 dark:border-emerald-600 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Header with Drag Handle */}
      <div
        data-drag-handle
        className="bg-emerald-700 dark:bg-emerald-800 py-2.5 px-4 select-none flex items-center justify-between cursor-grab active:cursor-grabbing text-white"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm tracking-wide">Add New Customer</span>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          className="w-6 h-6 flex items-center justify-center bg-black/20 hover:bg-red-600 rounded text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Name (Mandatory) */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            Customer Name <span className="text-red-600 font-bold">*</span>
          </label>
          <div className="relative flex items-center">
            <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Rahim Uddin"
              disabled={isSaving}
              required
              className="w-full h-8 pl-8 pr-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium disabled:opacity-60"
            />
          </div>
        </div>

        {/* Phone Number (Mandatory) */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            Phone Number <span className="text-red-600 font-bold">*</span>
          </label>
          <div className="relative flex items-center">
            <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 01712345678"
              disabled={isSaving}
              required
              className="w-full h-8 pl-8 pr-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium disabled:opacity-60"
            />
          </div>
        </div>

        {/* Address (Optional) */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
            Address <span className="text-neutral-500 font-normal text-[11px]">(Optional)</span>
          </label>
          <div className="relative flex items-start">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2 pointer-events-none" />
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House #12, Road #4, Dhanmondi, Dhaka"
              disabled={isSaving}
              className="w-full pl-8 pr-2 py-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium resize-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="px-4 h-7 text-xs font-semibold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-slate-700 border border-neutral-300 dark:border-slate-600 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Save Customer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}