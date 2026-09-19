'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  Save,
  UserPlus,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

export interface AddKhusraCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearch?: string;
  onSuccess?: (customer: Customer) => void;
  zIndex?: string;
}

export function AddKhusraCustomerModal({
  open,
  onOpenChange,
  initialSearch = '',
  onSuccess,
  zIndex = 'z-[60]',
}: AddKhusraCustomerModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState<number | string>('0');

  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Generate a default code with RET- prefix
      const defaultCode = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
      setCode(defaultCode);
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue('0');
      setStatusMessage(null);
      setCodeWarning(null);
      setCodeAvailable(false);

      if (initialSearch && initialSearch.trim()) {
        const trimmed = initialSearch.trim();
        if (/^[0-9+-\s()]{5,}$/.test(trimmed)) {
          setPhone(trimmed);
        } else {
          setName(trimmed);
        }
      }

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    } else {
      setStatusMessage(null);
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsSaving(false);
    }
  }, [open, initialSearch]);

  // Real-time debounced check when customer code changes
  useEffect(() => {
    const trimmed = code.trim();
    if (!trimmed) {
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
          customer: { id: string; name: string; code: string } | null;
        }>(`/parties/customers/check-code/${encodeURIComponent(trimmed)}`);
        if (!active) return;
        if (res.data?.exists) {
          setCodeWarning(
            `Code "${trimmed}" already exists (${res.data.customer?.name}).`
          );
          setCodeAvailable(false);
        } else {
          setCodeWarning(null);
          setCodeAvailable(true);
        }
      } catch {
        // Silently ignore network check failure
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setStatusMessage({
        text: 'Customer Code is required.',
        isError: true,
      });
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusMessage({
        text: 'Customer name is required (at least 2 characters).',
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

    setIsSaving(true);
    setStatusMessage(null);

    const dueVal = parseFloat(String(openingDue));
    const cleanOpeningDue = isNaN(dueVal) ? 0 : Math.max(0, dueVal);

    const payload = {
      code: trimmedCode,
      name: trimmedName,
      customerType: 'RETAIL' as const,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      openingDue: cleanOpeningDue,
      isActive: true,
    };

    try {
      const res = await api.post<Customer>('/parties/customers', payload);
      toast.success(`Retail Customer "${res.data.name}" added successfully!`);
      if (onSuccess) onSuccess(res.data);
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to save customer. Please check inputs.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm ${zIndex} flex items-center justify-center p-3 animate-in fade-in duration-150`}>
        <div
          className="p-0 max-w-md w-full border-2 border-[#006400] dark:border-emerald-800 rounded-none bg-[#c6d8ea] dark:bg-slate-900 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-300" />
              <span className="font-bold text-sm tracking-wide">
                Add Retail Customer (খুচরা কাস্টমার)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white p-0.5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-4 space-y-3.5">
            {statusMessage && (
              <div
                className={`p-2.5 text-xs font-semibold flex items-center gap-2 border ${
                  statusMessage.isError
                    ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-900'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900'
                }`}
              >
                {statusMessage.isError ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Customer Code */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Customer Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={codeInputRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RET-1001"
                  required
                  className="w-full h-8 px-2.5 font-mono text-xs font-bold bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
                />
                <div className="absolute right-2 top-2 flex items-center">
                  {isCheckingCode && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />}
                  {!isCheckingCode && codeAvailable && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
              </div>
              {codeWarning && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                  {codeWarning}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahim Mia / Walk-in Customer"
                required
                className="w-full h-8 px-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                Address / Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Local Market, Shop 4"
                className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
              />
            </div>

            {/* Opening Due (Baki hisab) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                Opening Due (পূর্বের বাকি হিসাব - ঐচ্ছিক)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={openingDue}
                onChange={(e) => setOpeningDue(e.target.value)}
                placeholder="0.00"
                className="w-full h-8 px-2.5 font-mono text-xs font-bold bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:text-white"
              />
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                খুচরা কাস্টমারের পূর্বের কোনো বাকি থাকলে এখানে দিন। না থাকলে ০ রাখুন।
              </p>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 border-t border-neutral-300 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="h-8 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 border border-neutral-400 dark:border-slate-600 font-bold text-xs shadow-sm transition-colors text-neutral-800 dark:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (!!codeWarning && !codeAvailable)}
                className="h-8 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Retail Customer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
