'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Company } from '@/lib/types';
import {
  Building2,
  Calendar as CalendarIcon,
  Search,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  RotateCcw,
  Save,
  Maximize2,
  Package,
} from 'lucide-react';
import { CompanyModal } from '@/components/companies/company-modal';

export default function CompaniesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Current Date Display
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Master Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Currently Selected Company for Editing (null = new entry mode)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form Fields
  const [systemId, setSystemId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Auto-code suggestion & validation state
  const [suggestedCode, setSuggestedCode] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeAvailable, setCodeAvailable] = useState(false);

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ text: string; isError: boolean } | null>(null);

  // Modal State (for pop-out view)
  const [modalOpen, setModalOpen] = useState(false);

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Fetch Companies List
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Company[]>('/companies', { search });
      setCompanies(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Next Suggested 3-digit Code
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

  useEffect(() => {
    fetchCompanies();
    fetchSuggestedCode();
  }, []);

  // Real-time debounced duplicate check when 3-digit code is typed
  useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length !== 3) {
      setCodeWarning(null);
      setCodeAvailable(false);
      setIsCheckingCode(false);
      return;
    }

    if (selectedCompany && selectedCompany.code === trimmed) {
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
          selectedCompany?.id ? { excludeId: selectedCompany.id } : undefined
        );
        if (!active) return;
        if (res.data?.exists) {
          setCodeWarning(
            `Code "${trimmed}" already exists (used by "${res.data.company?.name}").`
          );
          setCodeAvailable(false);
        } else {
          setCodeWarning(null);
          setCodeAvailable(true);
        }
      } catch {
        // ignore
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, selectedCompany]);

  // Select a company from the data grid to edit
  const handleSelectCompany = (comp: Company) => {
    setSelectedCompany(comp);
    setSystemId(comp.id.length > 8 ? comp.id.slice(0, 8).toUpperCase() : comp.id.toUpperCase());
    setName(comp.name || '');
    setCode(comp.code || '');
    setDescription(comp.description || '');
    setIsActive(comp.isActive !== false);
    setStatusBanner(null);
    setCodeWarning(null);
    setCodeAvailable(false);
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  // Reset form to blank (New Company mode)
  const handleReset = () => {
    setSelectedCompany(null);
    setSystemId('');
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setStatusBanner(null);
    setCodeWarning(null);
    setCodeAvailable(false);
    fetchSuggestedCode();
    setTimeout(() => nameInputRef.current?.focus(), 80);
  };

  // Strict 3-digit numeric input handler (no letters, no leading zero)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('0')) {
      val = val.replace(/^0+/, '');
    }
    val = val.slice(0, 3);
    setCode(val);
    setCodeWarning(null);
    setCodeAvailable(false);
  };

  // Save / Update Company handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setStatusBanner({
        text: 'Company Name is required (at least 2 characters).',
        isError: true,
      });
      nameInputRef.current?.focus();
      return;
    }

    const trimmedCode = code.trim();
    if (trimmedCode) {
      if (!/^[1-9][0-9]{2}$/.test(trimmedCode)) {
        setStatusBanner({
          text: 'Company code must be a 3-digit number (100–999) without leading zero, or left blank to auto-generate.',
          isError: true,
        });
        return;
      }
      if (codeWarning) {
        setStatusBanner({
          text: codeWarning,
          isError: true,
        });
        return;
      }
    }

    setIsSaving(true);
    setStatusBanner(null);

    const payload: {
      name: string;
      code?: string;
      description?: string;
      isActive: boolean;
    } = {
      name: trimmedName,
      isActive,
    };

    if (trimmedCode) payload.code = trimmedCode;
    if (description.trim()) payload.description = description.trim();

    try {
      if (selectedCompany) {
        // Update existing company
        const res = await api.patch<Company>(`/companies/${selectedCompany.id}`, payload);
        setStatusBanner({
          text: `Company "${res.data.name}" updated successfully!`,
          isError: false,
        });
        setSelectedCompany(res.data);
        await fetchCompanies();
      } else {
        // Create new company
        const res = await api.post<Company>('/companies', payload);
        setStatusBanner({
          text: `Company "${res.data.name}" created successfully with code ${res.data.code}!`,
          isError: false,
        });
        setSelectedCompany(res.data);
        setSystemId(res.data.id.slice(0, 8).toUpperCase());
        setCode(res.data.code || '');
        await fetchCompanies();
        fetchSuggestedCode();
      }
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to save company record.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Company handler
  const handleDelete = async () => {
    if (!selectedCompany) return;
    const confirmMsg = `Are you sure you want to delete company "${selectedCompany.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    setStatusBanner(null);

    try {
      await api.delete(`/companies/${selectedCompany.id}`);
      setStatusBanner({
        text: `Company "${selectedCompany.name}" deleted successfully.`,
        isError: false,
      });
      handleReset();
      await fetchCompanies();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete company. It may be linked to catalog products.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered companies based on search and status
  const filteredCompanies = companies.filter((c) => {
    if (statusFilter === 'ACTIVE' && !c.isActive) return false;
    if (statusFilter === 'INACTIVE' && c.isActive) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const activeCount = companies.filter((c) => c.isActive).length;
  const inactiveCount = companies.filter((c) => !c.isActive).length;

  return (
    <div className="w-full space-y-3">
      {/* Desktop Main Window Frame */}
      <div className="border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              Company / Brand Management
              <span className="text-[11px] font-mono font-normal text-emerald-200 uppercase tracking-widest hidden sm:inline">
                [Manufacturer Registry]
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Date Box */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-2 py-0.5 font-mono text-xs shadow-xs">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Date</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentDate}</span>
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-500 ml-0.5" />
            </div>

            {/* Pop-out Modal Trigger */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              title="Open Draggable Dialog Window"
              className="h-6 px-2 bg-white/90 dark:bg-slate-800 hover:bg-white text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-xs border border-neutral-400 flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Maximize2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden md:inline">Pop-out Dialog</span>
            </button>
          </div>
        </div>

        {/* Master Form Section (Top Area) */}
        <div className="p-3 sm:p-4 space-y-3 text-xs text-neutral-900 dark:text-neutral-100">
          {/* Status / Error Banner */}
          {statusBanner && (
            <div
              className={`p-2 rounded-xs text-xs font-semibold border flex items-center justify-between ${
                statusBanner.isError
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {statusBanner.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{statusBanner.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-neutral-500 hover:text-neutral-900 text-xs ml-2 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form & Actions Split Layout */}
          <form
            onSubmit={handleSave}
            className="flex flex-col md:flex-row justify-between gap-4 items-start bg-[#dbe7f3] dark:bg-slate-800/60 p-3.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner"
          >
            {/* Left Form Fields */}
            <div className="space-y-2 flex-1 w-full max-w-2xl">
              {/* Row 1: System ID & Brand Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <label className="sm:col-span-3 text-left sm:text-right font-bold text-neutral-800 dark:text-neutral-200">
                  System ID
                </label>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={systemId}
                    readOnly
                    placeholder="Auto"
                    className="w-full h-6 px-2 bg-neutral-200/90 dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none cursor-not-allowed font-semibold"
                  />
                </div>

                <label className="sm:col-span-2 text-left sm:text-right font-bold text-neutral-800 dark:text-neutral-200">
                  Brand / Code
                </label>
                <div className="sm:col-span-4 flex items-center gap-1.5">
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    pattern="[1-9][0-9]{2}"
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) return;
                      if (e.key === '0' && code.length === 0) {
                        e.preventDefault();
                        return;
                      }
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={suggestedCode ? `Auto: ${suggestedCode}` : 'e.g. 101'}
                    disabled={isSaving || isDeleting}
                    className={`w-28 h-6 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border rounded-xs font-mono font-bold text-xs focus:outline-none focus:ring-1 ${
                      codeWarning
                        ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                        : codeAvailable
                        ? 'border-emerald-500 focus:ring-emerald-500 text-emerald-700'
                        : 'border-neutral-400 dark:border-slate-600 focus:ring-emerald-600'
                    }`}
                  />
                  {isCheckingCode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  ) : codeAvailable ? (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5" /> OK
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      (Optional)
                    </span>
                  )}
                </div>
              </div>

              {/* Code Warning notice if any */}
              {codeWarning && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-3" />
                  <div className="sm:col-span-9 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1 rounded-xs border border-rose-200">
                    ⚠️ {codeWarning}
                  </div>
                </div>
              )}

              {/* Row 2: Company Name (Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <label className="sm:col-span-3 text-left sm:text-right font-bold text-neutral-900 dark:text-neutral-100">
                  Company Name <span className="text-red-600">*</span>
                </label>
                <div className="sm:col-span-9">
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="e.g. RFL Plastics, Kiam, Walton, ACI"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving || isDeleting}
                    className="w-full h-6 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Row 3: Description / Notes (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                <label className="sm:col-span-3 text-left sm:text-right font-bold text-neutral-800 dark:text-neutral-200 pt-0.5">
                  Description
                </label>
                <div className="sm:col-span-9">
                  <textarea
                    rows={2}
                    placeholder="Manufacturer origin, brand category, or notes (Optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving || isDeleting}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none font-medium"
                  />
                </div>
              </div>

              {/* Row 4: Status (Active / Inactive) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <label className="sm:col-span-3 text-left sm:text-right font-bold text-neutral-800 dark:text-neutral-200">
                  Status
                </label>
                <div className="sm:col-span-9 flex items-center gap-6">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="pageCompStatus"
                      checked={isActive === true}
                      onChange={() => setIsActive(true)}
                      disabled={isSaving || isDeleting}
                      className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                      Active Brand
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="pageCompStatus"
                      checked={isActive === false}
                      onChange={() => setIsActive(false)}
                      disabled={isSaving || isDeleting}
                      className="w-3.5 h-3.5 text-neutral-500 accent-neutral-600 cursor-pointer"
                    />
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium text-xs">
                      Inactive
                    </span>
                  </label>

                  {selectedCompany && selectedCompany._count?.products !== undefined && (
                    <span className="ml-auto text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                      Products: <strong className="text-neutral-900 dark:text-neutral-100">{selectedCompany._count.products}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Buttons Stack (Matches Sale Rate Style) */}
            <div className="flex flex-row md:flex-col gap-2 w-full md:w-32 justify-end shrink-0 pt-0.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving || isDeleting}
                className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                <span>Refresh</span>
              </button>

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
                className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                )}
                <span>{selectedCompany ? 'Update' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving || isDeleting || !selectedCompany || !isAdmin}
                title={!selectedCompany ? 'Select a company to delete' : undefined}
                className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </form>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-[#a8c2dc] dark:border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs shrink-0">
                Filter:
              </span>
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, 3-digit code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-6 pl-7 pr-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 text-neutral-900 dark:text-neutral-100 text-xs rounded-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Status:</span>
              <div className="flex rounded-xs border border-neutral-400 dark:border-slate-600 overflow-hidden text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 ${
                    statusFilter === 'ALL'
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  All ({companies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2 py-0.5 border-l border-neutral-400 dark:border-slate-600 ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-2 py-0.5 border-l border-neutral-400 dark:border-slate-600 ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-rose-700 text-white'
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  Inactive ({inactiveCount})
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Spreadsheet Data Grid */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <div className="max-h-[380px] overflow-y-auto overflow-x-auto min-h-[200px] flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-12 text-center font-bold">
                      SN
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-center font-bold">
                      Code
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[200px] font-bold">
                      Company / Brand Name
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[220px] font-bold">
                      Description
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-center font-bold">
                      Products
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-center font-bold">
                      Status
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-mono text-neutral-600 font-bold">
                      System ID
                    </th>
                    <th className="py-1 px-2 font-bold w-20 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500 italic">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-emerald-600" />
                        Loading company database...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-red-600 font-bold">
                        {error}
                      </td>
                    </tr>
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500 italic">
                        No companies found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((comp, idx) => {
                      const isSelected = selectedCompany?.id === comp.id;
                      const isCyan = idx % 2 === 1;

                      return (
                        <tr
                          key={comp.id}
                          onClick={() => handleSelectCompany(comp)}
                          className={`cursor-pointer transition-colors border-b border-neutral-200 dark:border-slate-800 ${
                            isSelected
                              ? 'bg-[#0055ea] text-white font-semibold'
                              : isCyan
                              ? 'bg-[#e8f4fc] dark:bg-slate-800/80 hover:bg-[#d0ebff]'
                              : 'bg-white dark:bg-slate-900 hover:bg-[#d0ebff]'
                          }`}
                        >
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-center font-bold ${
                              isSelected ? 'text-white' : 'text-neutral-500'
                            }`}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-center font-mono font-bold ${
                              isSelected
                                ? 'text-yellow-200'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {comp.code ? `#${comp.code}` : '—'}
                          </td>
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 font-bold ${
                              isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {comp.name}
                          </td>
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 truncate max-w-xs ${
                              isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {comp.description || '—'}
                          </td>
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-center font-mono ${
                              isSelected ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {comp._count?.products ?? 0}
                          </td>
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded-xs font-bold text-[10px] ${
                                isSelected
                                  ? comp.isActive
                                    ? 'bg-emerald-400 text-neutral-900'
                                    : 'bg-rose-400 text-neutral-900'
                                  : comp.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-neutral-400'
                              }`}
                            >
                              {comp.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td
                            className={`py-1 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-[11px] ${
                              isSelected ? 'text-blue-100' : 'text-neutral-500'
                            }`}
                          >
                            {comp.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-1 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCompany(comp);
                                }}
                                title="Edit in Form"
                                className={`p-0.5 rounded cursor-pointer ${
                                  isSelected
                                    ? 'text-white hover:bg-blue-700'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-neutral-200'
                                }`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1 border border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1">
            <div className="flex items-center gap-3">
              <span>
                Total Records: <strong>{companies.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-800 dark:text-emerald-300">
                Active: <strong>{activeCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-800 dark:text-rose-300">
                Inactive: <strong>{inactiveCount}</strong>
              </span>
            </div>

            <div className="text-neutral-600 dark:text-neutral-400 text-[10px]">
              {selectedCompany ? (
                <span>
                  Selected: <strong>{selectedCompany.name}</strong> ({selectedCompany.code ? `#${selectedCompany.code}` : 'No code'})
                </span>
              ) : (
                <span>Mode: Ready for New Brand Entry</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Draggable Company Modal (Available as Companion) */}
      <CompanyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        company={selectedCompany}
        onSuccess={() => {
          fetchCompanies();
          fetchSuggestedCode();
        }}
        onDelete={() => {
          handleReset();
          fetchCompanies();
        }}
      />
    </div>
  );
}
