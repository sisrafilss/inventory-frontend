'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Warehouse, Product } from '@/lib/types';
import {
  Warehouse as WarehouseIcon,
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
  ArrowRightLeft,
  MapPin,
} from 'lucide-react';

export default function WarehousesPage() {
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Currently Selected Warehouse for Editing (null = new entry mode)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Form Fields
  const [systemId, setSystemId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ text: string; isError: boolean } | null>(null);

  // Stock Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: '',
    targetWarehouseId: '',
    productId: '',
    quantity: 1,
    note: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Fetch Warehouses List
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Warehouse[]>('/warehouses', { search });
      setWarehouses(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products for Transfer dropdown
  const fetchProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products', { limit: 200 });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products for transfer:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (statusFilter === 'ACTIVE' && !wh.isActive) return false;
      if (statusFilter === 'INACTIVE' && wh.isActive) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchName = wh.name.toLowerCase().includes(q);
      const matchCode = wh.code?.toLowerCase().includes(q) || false;
      const matchAddress = wh.address?.toLowerCase().includes(q) || false;
      const matchId = wh.id.toLowerCase().includes(q);

      return matchName || matchCode || matchAddress || matchId;
    });
  }, [warehouses, statusFilter, search]);

  // Handle Selecting a Warehouse from the Table
  const handleSelectWarehouse = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setSystemId(wh.id);
    setName(wh.name);
    setCode(wh.code || '');
    setAddress(wh.address || '');
    setIsDefault(Boolean(wh.isDefault));
    setIsActive(Boolean(wh.isActive));
    setStatusBanner(null);
  };

  // Reset / Clear Form
  const handleResetForm = () => {
    setSelectedWarehouse(null);
    setSystemId('');
    setName('');
    setCode('');
    setAddress('');
    setIsDefault(false);
    setIsActive(true);
    setStatusBanner(null);
    nameInputRef.current?.focus();
  };

  // Save / Update Warehouse
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setStatusBanner({ text: 'Please enter a valid warehouse name.', isError: true });
      nameInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setStatusBanner(null);

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      address: address.trim() || undefined,
      isDefault,
      isActive,
    };

    try {
      if (selectedWarehouse) {
        // Update
        const res = await api.patch<{ data: Warehouse; message?: string }>(
          `/warehouses/${selectedWarehouse.id}`,
          payload
        );
        const updated = (res as any).data || res;
        setStatusBanner({
          text: `Warehouse "${name}" updated successfully!`,
          isError: false,
        });
        await fetchWarehouses();
        if (updated && updated.id) {
          setSelectedWarehouse(updated);
        }
      } else {
        // Create
        const res = await api.post<{ data: Warehouse; message?: string }>('/warehouses', payload);
        const created = (res as any).data || res;
        setStatusBanner({
          text: `Warehouse "${name}" registered successfully!`,
          isError: false,
        });
        await fetchWarehouses();
        handleResetForm();
      }
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to save warehouse.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Warehouse
  const handleDelete = async () => {
    if (!selectedWarehouse) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete warehouse "${selectedWarehouse.name}"?\n\nIf this location contains active inventory or past transaction records, delete will be blocked to maintain data integrity.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    setStatusBanner(null);
    try {
      await api.delete(`/warehouses/${selectedWarehouse.id}`);
      setStatusBanner({
        text: `Warehouse "${selectedWarehouse.name}" was successfully deleted.`,
        isError: false,
      });
      handleResetForm();
      await fetchWarehouses();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete warehouse.',
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (defaultSourceId?: string) => {
    const srcId = defaultSourceId || selectedWarehouse?.id || warehouses[0]?.id || '';
    const tgt = warehouses.find((w) => w.id !== srcId);
    setTransferForm({
      sourceWarehouseId: srcId,
      targetWarehouseId: tgt?.id || '',
      productId: products[0]?.id || '',
      quantity: 1,
      note: '',
    });
    setTransferModalOpen(true);
  };

  // Execute Stock Transfer
  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceWarehouseId || !transferForm.targetWarehouseId) {
      alert('Please select both source and destination warehouses.');
      return;
    }
    if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
      alert('Source and destination warehouses cannot be the same.');
      return;
    }
    if (transferForm.quantity <= 0) {
      alert('Transfer quantity must be greater than 0.');
      return;
    }
    setIsTransferring(true);
    try {
      await api.post('/warehouses/transfer', {
        ...transferForm,
        quantity: Number(transferForm.quantity),
      });
      setStatusBanner({
        text: 'Stock successfully transferred between warehouses!',
        isError: false,
      });
      setTransferModalOpen(false);
      await fetchWarehouses();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer stock.');
    } finally {
      setIsTransferring(false);
    }
  };

  const activeCount = warehouses.filter((w) => w.isActive).length;
  const inactiveCount = warehouses.filter((w) => !w.isActive).length;
  const defaultWarehouse = warehouses.find((w) => w.isDefault);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      {/* Desktop Main Window Frame */}
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏬</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              Warehouse / Godown Management
              <span className="hidden sm:inline text-[11px] font-normal text-emerald-200 tracking-normal border border-emerald-500/40 px-1.5 py-0.5 rounded-xs bg-emerald-900/30">
                STORAGE & MULTI-LOCATION REGISTRY
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#004d00]/60 border border-emerald-600/40 px-2 py-0.5 rounded-xs text-[11px] font-mono text-emerald-100 shadow-inner">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Date {currentDate}</span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenTransfer()}
              disabled={warehouses.length < 2 || products.length === 0}
              className="px-2.5 py-1 text-[11px] font-bold bg-white text-[#006400] hover:bg-emerald-50 border border-white shadow-xs flex items-center gap-1.5 rounded-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#006400]" />
              <span>Transfer Stock</span>
            </button>
          </div>
        </div>

        {/* Master Form & Table Section */}
        <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 space-y-2 text-xs text-neutral-900 dark:text-neutral-100">
          {/* Status / Error Banner */}
          {statusBanner && (
            <div
              className={`p-2 rounded-xs border text-xs flex items-center justify-between shadow-xs shrink-0 ${
                statusBanner.isError
                  ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusBanner.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="font-semibold">{statusBanner.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form & Actions Split Layout */}
          <form
            onSubmit={handleSave}
            className="flex flex-col md:flex-row justify-between gap-3 items-start bg-[#dbe7f3] dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner shrink-0"
          >
            {/* Left Form Fields */}
            <div className="space-y-2 flex-1 w-full max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* System ID */}
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                    System ID
                  </label>
                  <input
                    type="text"
                    value={systemId ? systemId.slice(0, 8).toUpperCase() : (selectedWarehouse ? 'SAVED' : 'AUTO')}
                    disabled
                    className="w-32 px-2 py-1 bg-[#e4ecf5] dark:bg-slate-900/60 border border-[#a8c2dc] dark:border-slate-700 rounded-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 text-xs cursor-not-allowed select-all"
                  />
                </div>

                {/* Godown Code */}
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                    Godown Code
                  </label>
                  <div className="relative flex-1 max-w-[180px]">
                    <input
                      ref={codeInputRef}
                      type="text"
                      placeholder="e.g. WH-01"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 italic shrink-0">(Optional)</span>
                </div>
              </div>

              {/* Warehouse / Godown Name */}
              <div className="flex items-center gap-2">
                <label className="w-24 text-right font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                  Godown Name <span className="text-red-500">*</span>
                </label>
                <div className="flex-1">
                  <input
                    ref={nameInputRef}
                    required
                    type="text"
                    placeholder="Enter warehouse / godown name (e.g. Main Godown, Dhaka Hub, Factory Depot)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Location / Physical Address */}
              <div className="flex items-center gap-2">
                <label className="w-24 text-right font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                  Location
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Physical address / premises location (e.g. Plot 14, Sector 7, Tongi, Gazipur)..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              {/* Default & Active Status Radios/Checkboxes */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pl-0 sm:pl-26 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#006400] border-neutral-400 rounded-xs focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1">
                    Default Godown (Primary for Sales & Restocking)
                    {isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                  </span>
                </label>

                <div className="flex items-center gap-3 border-l border-neutral-300 dark:border-slate-700 pl-3">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 text-xs">Status:</span>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={isActive}
                      onChange={() => setIsActive(true)}
                      className="w-3.5 h-3.5 text-[#006400] border-neutral-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400 text-xs">Active Godown</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="status"
                      checked={!isActive}
                      onChange={() => setIsActive(false)}
                      className="w-3.5 h-3.5 text-rose-600 border-neutral-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="font-semibold text-neutral-600 dark:text-neutral-400 text-xs">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Action Buttons Stack (Accounting ERP style) */}
            <div className="flex md:flex-col flex-wrap gap-1.5 w-full md:w-32 shrink-0 self-center md:self-start">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 md:flex-none h-7 px-2.5 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-[#b81b4c] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xs font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                title="Reset form to enter a new warehouse"
              >
                <RotateCcw className="w-3 h-3 text-[#b81b4c]" />
                Refresh
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 md:flex-none h-7 px-2.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xs font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Save className="w-3 h-3 text-emerald-700" />
                )}
                {selectedWarehouse ? 'Update' : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={!selectedWarehouse || isDeleting}
                className="flex-1 md:flex-none h-7 px-2.5 bg-white dark:bg-slate-800 text-[#b81b4c] hover:text-red-700 border border-[#b81b4c] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xs font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Delete selected warehouse (only if empty)"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Delete
              </button>

              <button
                type="button"
                onClick={() => handleOpenTransfer(selectedWarehouse?.id)}
                disabled={warehouses.length < 2 || products.length === 0}
                className="flex-1 md:flex-none h-7 px-2 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xs font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Transfer stock to/from this warehouse"
              >
                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                Transfer Stock
              </button>
            </div>
          </form>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 border-t border-[#a8c2dc] dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs shrink-0">
                Filter:
              </span>
              <div className="relative flex-1 sm:w-80">
                <input
                  type="text"
                  placeholder="Search by name, code, address, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1.5" />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs text-neutral-600 hover:text-neutral-900 underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mr-1">
                Status:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-[#004d00] text-white border-[#004d00]'
                    : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                }`}
              >
                All ({warehouses.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                }`}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>

          {/* Desktop Spreadsheet Data Grid */}
          <div className="flex-1 min-h-[160px] flex flex-col border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                  <tr>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-12 text-center">
                      SN
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">
                      Code
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">
                      Warehouse / Godown Name
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[220px]">
                      Location / Physical Address
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">
                      Stock Types
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">
                      Default
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">
                      Status
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center font-mono">
                      System ID
                    </th>
                    <th className="px-3 py-1.5 w-28 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Loading warehouses from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-rose-600 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-neutral-500 font-medium">
                        No warehouses found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredWarehouses.map((wh, idx) => {
                      const isSelected = selectedWarehouse?.id === wh.id;
                      return (
                        <tr
                          key={wh.id}
                          onClick={() => handleSelectWarehouse(wh)}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-[#0056b3] text-white font-semibold cursor-pointer'
                              : idx % 2 === 0
                              ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                              : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                          }`}
                        >
                          {/* SN */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center font-mono">
                            {idx + 1}
                          </td>

                          {/* Code */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center font-mono font-bold">
                            {wh.code ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-xs ${
                                  isSelected
                                    ? 'bg-blue-800 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006400] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {wh.code}
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-normal">--</span>
                            )}
                          </td>

                          {/* Name */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 font-semibold flex-1">
                            <div className="flex items-center gap-1.5">
                              <WarehouseIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
                              <span>{wh.name}</span>
                            </div>
                          </td>

                          {/* Address / Location */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-neutral-600 dark:text-neutral-400">
                            {wh.address ? (
                              <div className="flex items-center gap-1">
                                <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-200' : 'text-neutral-400'}`} />
                                <span className={isSelected ? 'text-white' : ''}>{wh.address}</span>
                              </div>
                            ) : (
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-400'}>
                                --
                              </span>
                            )}
                          </td>

                          {/* Products Stocked */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded-xs font-mono font-bold ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700'
                              }`}
                            >
                              {wh._count?.stocks || 0}
                            </span>
                          </td>

                          {/* Default */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center">
                            {wh.isDefault ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-xs font-bold inline-flex items-center gap-1 text-[11px] ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                Primary
                              </span>
                            ) : (
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-400 text-[11px]'}>
                                Secondary
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                                wh.isActive
                                  ? isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {wh.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* System ID */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center font-mono text-[11px]">
                            <span className={isSelected ? 'text-blue-200' : 'text-neutral-500'}>
                              {wh.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-2 py-1 text-center">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectWarehouse(wh);
                                  nameInputRef.current?.focus();
                                }}
                                className={`p-1 rounded-xs border transition-colors ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                                title="Edit this warehouse in master form"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTransfer(wh.id)}
                                className={`p-1 rounded-xs border transition-colors ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-neutral-300 dark:border-slate-700 hover:bg-blue-50'
                                }`}
                                title="Transfer stock from this warehouse"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
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
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1 border border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Total Godowns: <strong>{warehouses.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-900 dark:text-emerald-300">
                Active: <strong>{activeCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-400">
                Inactive: <strong>{inactiveCount}</strong>
              </span>
              {defaultWarehouse && (
                <>
                  <span>•</span>
                  <span className="text-[#004d00] dark:text-emerald-300 font-bold">
                    Primary: {defaultWarehouse.name} {defaultWarehouse.code ? `(${defaultWarehouse.code})` : ''}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {selectedWarehouse ? (
                <span className="bg-[#004d00] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedWarehouse.name} {selectedWarehouse.code ? `[${selectedWarehouse.code}]` : ''}
                </span>
              ) : (
                <span className="italic text-neutral-600 dark:text-neutral-400">
                  Mode: New Godown Entry
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Transfer Desktop Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 flex items-center justify-between border-b border-[#004d00] dark:border-emerald-900">
              <div className="flex items-center gap-2 text-white">
                <ArrowRightLeft className="w-4 h-4 text-emerald-300" />
                <h2 className="text-sm sm:text-base font-bold tracking-wide">
                  Transfer Stock Between Warehouses
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-xs text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTransferStock} className="p-4 space-y-3 text-xs text-neutral-900 dark:text-neutral-100">
              <div className="bg-[#dbe7f3] dark:bg-slate-800/60 p-3 rounded-xs border border-[#b2c8dc] dark:border-slate-700 space-y-3 shadow-inner">
                {/* Source & Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      From Warehouse (Source) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transferForm.sourceWarehouseId}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.code ? `[${w.code}]` : ''} {w.isDefault ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      To Warehouse (Target) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transferForm.targetWarehouseId}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, targetWarehouseId: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    >
                      {warehouses
                        .filter((w) => w.id !== transferForm.sourceWarehouseId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.code ? `[${w.code}]` : ''} {w.isDefault ? '★' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Product to Move */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                    Product to Transfer <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={transferForm.productId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, productId: e.target.value })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ''} — Stock: {p.quantity} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transfer Quantity & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={transferForm.quantity}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      Transfer Note / Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stock replenishment for showroom..."
                      value={transferForm.note}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, note: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a8c2dc] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  disabled={isTransferring}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700 hover:bg-neutral-100 rounded-xs font-bold text-xs shadow-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-4 py-1.5 bg-[#006400] text-white hover:bg-emerald-800 border border-[#004d00] rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isTransferring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  )}
                  Execute Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
