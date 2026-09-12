'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  Save,
  Trash2,
  RotateCcw,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Mail,
  DollarSign,
  Building2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Customer, Company } from '@/lib/types';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';

export interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: (customer?: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export function CustomerModal({
  open,
  onOpenChange,
  customer = null,
  onSuccess,
  onDelete,
}: CustomerModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Companies dropdown & search states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [highlightedCompanyIdx, setHighlightedCompanyIdx] = useState(0);
  const companyBoxRef = useRef<HTMLDivElement>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);

  // Real-time code duplicate check states
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch registered companies on open
  useEffect(() => {
    if (!open) return;
    let active = true;
    api
      .get<Company[]>('/companies', { isActive: 'true' })
      .then((res) => {
        if (active && res.data) {
          setCompanies(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load companies:', err);
      });
    return () => {
      active = false;
    };
  }, [open]);

  // Close company dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        companyBoxRef.current &&
        !companyBoxRef.current.contains(e.target as Node)
      ) {
        setIsCompanyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter companies by code or name
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.trim().toLowerCase();
    return companies.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q);
      const matchCode = c.code ? c.code.toLowerCase().includes(q) : false;
      return matchName || matchCode;
    });
  }, [companies, companySearch]);

  useEffect(() => {
    if (open) {
      if (customer) {
        setCode(customer.code || '');
        setName(customer.name || '');
        setCompanyName(customer.companyName || '');
        setCompanySearch(customer.companyName || '');
        setPhone(customer.phone || '');
        setEmail(customer.email || '');
        setAddress(customer.address || '');
        setOpeningDue(Number(customer.openingDue) || 0);
        setIsActive(customer.isActive !== false);
      } else {
        resetForm();
      }
      setIsCompanyDropdownOpen(false);
      setHighlightedCompanyIdx(0);
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
      setIsCompanyDropdownOpen(false);
    }
  }, [open, customer]);

  // Real-time debounced check when a customer code is typed
  useEffect(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsCheckingCode(false);
      return;
    }

    if (customer && customer.code?.trim().toLowerCase() === trimmed.toLowerCase()) {
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
        }>(
          `/parties/customers/check-code/${encodeURIComponent(trimmed)}`,
          customer?.id ? { excludeId: customer.id } : undefined
        );
        if (!active) return;
        if (res.data?.exists) {
          setCodeWarning(
            `Code "${trimmed}" already exists (used by "${res.data.customer?.name}").`
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
  }, [code, customer]);

  const resetForm = () => {
    setCode('');
    setName('');
    setCompanyName('');
    setCompanySearch('');
    setIsCompanyDropdownOpen(false);
    setHighlightedCompanyIdx(0);
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningDue(0);
    setIsActive(true);
    setStatusMessage(null);
    setCodeWarning(null);
    setCodeAvailable(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setStatusMessage({
        text: 'Customer Code is required and cannot be empty.',
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

    const payload = {
      code: trimmedCode,
      name: trimmedName,
      companyName: companyName.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      openingDue: Number(openingDue) || 0,
      isActive,
    };

    try {
      if (customer) {
        const res = await api.patch<Customer>(`/parties/customers/${customer.id}`, payload);
        setStatusMessage({ text: 'Customer updated successfully!', isError: false });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      } else {
        const res = await api.post<Customer>('/parties/customers', payload);
        setStatusMessage({ text: 'Customer registered successfully!', isError: false });
        if (onSuccess) onSuccess(res.data);
        setTimeout(() => onOpenChange(false), 300);
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to save customer. Please check inputs.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    const confirmMsg = `Are you sure you want to delete customer "${customer.name}"?\n\nIf this customer has past sales invoices or ledger entries, deletion will be blocked to maintain audit trails.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      await api.delete(`/parties/customers/${customer.id}`);
      if (onDelete) onDelete(customer);
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to delete customer.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;
  const isEdit = Boolean(customer);

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
            Client & Accounts Receivable Registry
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-300" />
            {isEdit ? 'Edit Customer Account' : 'Add New Customer Account'}
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
                Editing: <span className="font-bold underline">{customer?.name}</span>
                {customer?.currentDue !== undefined && (
                  <span className="ml-2 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    [Due: ৳{Number(customer.currentDue).toLocaleString()}]
                  </span>
                )}
              </span>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400">
                Registering New Customer
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
          {/* Customer Code (Manual Input with Real-time Duplicate Check - MANDATORY) */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200 pt-1">
              Customer Code <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8 space-y-1">
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="e.g. CUST-101, RET-01"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setCodeWarning(null);
                    setCodeAvailable(false);
                  }}
                  disabled={isSaving}
                  className={`w-full px-2 py-1 pr-6 bg-white dark:bg-slate-900 border rounded-xs text-xs font-mono font-bold focus:outline-none ${
                    codeWarning
                      ? 'border-rose-500 text-rose-700 dark:text-rose-400 focus:ring-1 focus:ring-rose-500'
                      : codeAvailable
                      ? 'border-emerald-500 text-emerald-800 dark:text-emerald-300 focus:ring-1 focus:ring-emerald-500'
                      : 'border-neutral-400 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#006400]'
                  }`}
                />
                {isCheckingCode && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500 absolute right-2" />
                )}
                {codeAvailable && !isCheckingCode && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2" />
                )}
              </div>
              {codeWarning && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{codeWarning}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Name */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Customer Name <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <input
                ref={nameInputRef}
                type="text"
                required
                placeholder="e.g. Al-Amin Traders / Md. Hasan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 font-semibold"
              />
            </div>
          </div>

          {/* Company / Firm Selection (Dropdown + Search by Code or Name - Optional) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Company / Firm <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8 relative" ref={companyBoxRef}>
              <div className="relative flex items-center">
                <input
                  ref={companyInputRef}
                  type="text"
                  placeholder="Select company or search by code/name..."
                  value={companySearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCompanySearch(val);
                    setCompanyName(val);
                    setIsCompanyDropdownOpen(true);
                    setHighlightedCompanyIdx(0);
                  }}
                  onFocus={() => {
                    setIsCompanyDropdownOpen(true);
                    setHighlightedCompanyIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!isCompanyDropdownOpen) {
                        setIsCompanyDropdownOpen(true);
                      } else {
                        setHighlightedCompanyIdx((prev) =>
                          prev < filteredCompanies.length - 1 ? prev + 1 : prev
                        );
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedCompanyIdx((prev) => (prev > 0 ? prev - 1 : 0));
                    } else if (e.key === 'Enter') {
                      if (isCompanyDropdownOpen && filteredCompanies[highlightedCompanyIdx]) {
                        e.preventDefault();
                        const selected = filteredCompanies[highlightedCompanyIdx];
                        setCompanyName(selected.name);
                        setCompanySearch(selected.name);
                        setIsCompanyDropdownOpen(false);
                      }
                    } else if (e.key === 'Escape') {
                      setIsCompanyDropdownOpen(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full px-2 py-1 pr-14 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                />

                <div className="absolute right-1 flex items-center gap-0.5 text-neutral-500">
                  {companySearch && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => {
                        setCompanyName('');
                        setCompanySearch('');
                        setIsCompanyDropdownOpen(false);
                      }}
                      className="p-0.5 hover:text-rose-600 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Clear company"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setIsCompanyDropdownOpen((prev) => !prev);
                      companyInputRef.current?.focus();
                    }}
                    className="p-0.5 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                    title="Toggle company dropdown"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        isCompanyDropdownOpen ? 'rotate-180 text-emerald-700 dark:text-emerald-400' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Dropdown Popup */}
              {isCompanyDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 shadow-xl max-h-52 overflow-y-auto text-xs">
                  <div className="px-2.5 py-1 bg-[#eaf1f8] dark:bg-slate-800/80 border-b border-neutral-300 dark:border-slate-700 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                    <span>Search by Code or Company Name</span>
                    <span>{filteredCompanies.length} available</span>
                  </div>

                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((comp, idx) => {
                      const isSelected = companyName === comp.name;
                      const isHighlighted = idx === highlightedCompanyIdx;
                      return (
                        <div
                          key={comp.id}
                          onMouseEnter={() => setHighlightedCompanyIdx(idx)}
                          onClick={() => {
                            setCompanyName(comp.name);
                            setCompanySearch(comp.name);
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1.5 flex items-center justify-between border-b border-neutral-100 dark:border-slate-800 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 font-semibold text-emerald-900 dark:text-emerald-200'
                              : isHighlighted
                              ? 'bg-emerald-50/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Building2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-neutral-400'
                              }`}
                            />
                            <span className="truncate">{comp.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {comp.code && (
                              <span
                                className="px-1.5 py-0.5 font-mono text-[10px] font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 rounded"
                                title={`Company Code: ${comp.code}`}
                              >
                                #{comp.code}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-neutral-500 dark:text-neutral-400">
                      <p className="text-xs">No company matching &quot;{companySearch}&quot;</p>
                      {companySearch.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyName(companySearch.trim());
                            setIsCompanyDropdownOpen(false);
                          }}
                          className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer block mx-auto"
                        >
                          Use &quot;{companySearch.trim()}&quot; as custom company
                        </button>
                      )}
                    </div>
                  )}

                  {companyName && (
                    <div
                      onClick={() => {
                        setCompanyName('');
                        setCompanySearch('');
                        setIsCompanyDropdownOpen(false);
                      }}
                      className="px-2.5 py-1.5 text-center text-[11px] text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border-t border-neutral-200 dark:border-slate-700"
                    >
                      Clear Selection (No Company)
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Phone Number <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8">
              <input
                type="text"
                placeholder="01XXXXXXXXX"
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
                placeholder="customer@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSaving}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Office / Address */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200 pt-1">
              Address / Area
            </label>
            <div className="col-span-8">
              <textarea
                rows={2}
                placeholder="Village/Area, Thana, District, Delivery Location"
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
                  Opening due is locked after creation. Use Cash Collection action to adjust.
                </span>
              )}
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="grid grid-cols-12 items-center gap-2 pt-1 border-t border-[#b2c8dc] dark:border-slate-700">
            <div className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Account Status
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
                  Active Customer Account
                </span>
                <span className="text-[10px] text-neutral-500">
                  (Available for sales & billing)
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
                  <span>{isEdit ? 'Update Customer' : 'Save Customer'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

