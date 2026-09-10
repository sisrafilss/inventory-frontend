'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  Search,
  X,
  Loader2,
  Truck,
  RotateCcw,
  ArrowRight,
  Phone,
  MapPin,
  Plus,
} from 'lucide-react';
import { Supplier } from '@/lib/types';
import { api } from '@/lib/api/client';
import { SupplierModal } from '@/components/parties/supplier-modal';

export interface SupplierLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSupplier: (supplier: Supplier) => void;
  title?: string;
  initialSearch?: string;
}

export function SupplierLookupModal({
  open,
  onOpenChange,
  onSelectSupplier,
  title = 'Select Supplier',
  initialSearch = '',
}: SupplierLookupModalProps) {
  // Search & Filter States
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [dueFilter, setDueFilter] = useState<'ALL' | 'HAS_DUE' | 'NO_DUE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Supplier List
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Supplier Modal State
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (open) {
      if (initialSearch) {
        setSearch(initialSearch);
        setDebouncedSearch(initialSearch);
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
      fetchSuppliers();
    } else {
      setSearch('');
      setDebouncedSearch('');
      setDueFilter('ALL');
      setStatusFilter('ALL');
      setSuppliers([]);
      setAddSupplierOpen(false);
    }
  }, [open, initialSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: debouncedSearch.trim() || undefined,
        isActive:
          statusFilter === 'ACTIVE'
            ? 'true'
            : statusFilter === 'INACTIVE'
            ? 'false'
            : undefined,
        hasDue: dueFilter === 'HAS_DUE' ? 'true' : undefined,
      };

      const res = await api.get<Supplier[]>('/parties/suppliers', params);
      let list = res.data || [];

      if (dueFilter === 'NO_DUE') {
        list = list.filter((s) => Number(s.currentDue ?? s.openingDue ?? 0) <= 0);
      }

      setSuppliers(list);
    } catch (err) {
      console.error('Failed to fetch suppliers for lookup:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dueFilter]);

  // Refetch when filters change
  useEffect(() => {
    if (!open) return;
    fetchSuppliers();
  }, [debouncedSearch, statusFilter, dueFilter, open, fetchSuppliers]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDueFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleSelect = (supplier: Supplier) => {
    onSelectSupplier(supplier);
    onOpenChange(false);
  };

  const handleSupplierCreated = (s?: Supplier) => {
    if (!s) return;
    setSuppliers((prev) => [s, ...prev]);
    onSelectSupplier(s);
    setAddSupplierOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        draggable={true}
        closeOnBackdropClick={true}
        zIndex="z-[75]"
        className="p-0 max-w-4xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Top Banner with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none text-white shrink-0"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-sm tracking-wide">{title}</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-600/50 font-mono">
              {suppliers.length} Suppliers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-6 h-6 flex items-center justify-center bg-black/20 hover:bg-red-600 rounded text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 bg-neutral-100 dark:bg-slate-800/90 border-b border-neutral-300 dark:border-slate-700 space-y-2 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            {/* Main Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Code, Name, Company, Phone, or ID..."
                className="w-full h-8 pl-8 pr-7 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium placeholder:text-neutral-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Due Filter */}
            <div className="sm:col-span-3">
              <select
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value as any)}
                className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="ALL">All Dues</option>
                <option value="HAS_DUE">With Due (&gt;0)</option>
                <option value="NO_DUE">Zero Due (Settled)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Filters"
                className="h-8 w-full flex items-center justify-center gap-1 bg-white dark:bg-slate-900 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-600 rounded-sm text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Supplier Table */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh] bg-white dark:bg-slate-950 select-text"
        >
          <table className="w-full text-left text-xs border-collapse border-b border-neutral-300 dark:border-slate-800">
            <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-400 dark:border-slate-700 shadow-sm z-10 select-none">
              <tr>
                <th className="py-2 px-3 w-28 text-center border-r border-neutral-300 dark:border-slate-700 font-mono">
                  Code
                </th>
                <th className="py-2 px-3 text-left border-r border-neutral-300 dark:border-slate-700">
                  Supplier Name
                </th>
                <th className="py-2 px-3 w-36 text-left border-r border-neutral-300 dark:border-slate-700">
                  Phone / Contact
                </th>
                <th className="py-2 px-3 text-left border-r border-neutral-300 dark:border-slate-700 hidden sm:table-cell">
                  Address
                </th>
                <th className="py-2 px-3 w-28 text-right border-r border-neutral-300 dark:border-slate-700">
                  Current Due (Payable)
                </th>
                <th className="py-2 px-2 w-20 text-center border-r border-neutral-300 dark:border-slate-700 hidden md:table-cell">
                  Status
                </th>
                <th className="py-2 px-3 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {suppliers.map((s) => {
                const due = Number(s.currentDue ?? s.openingDue ?? 0);
                const hasDue = due > 0;

                return (
                  <tr
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors group"
                  >
                    {/* Supplier Code */}
                    <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-center">
                      <span className="bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                        #{s.code}
                      </span>
                    </td>

                    {/* Supplier Name */}
                    <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800">
                      <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {s.companyName && (
                          <span className="text-[10px] font-normal px-1 py-0.2 bg-neutral-100 dark:bg-slate-800 text-neutral-500 rounded border border-neutral-200 dark:border-slate-700">
                            {s.companyName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span>{s.phone || '—'}</span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 hidden sm:table-cell text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                      <div className="flex items-center gap-1 truncate">
                        {s.address ? (
                          <>
                            <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span className="truncate">{s.address}</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </td>

                    {/* Current Due */}
                    <td className="py-2 px-3 text-right border-r border-neutral-200 dark:border-slate-800 font-mono font-bold">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                          hasDue
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold'
                            : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        ৳{due.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-2 text-center border-r border-neutral-200 dark:border-slate-800 hidden md:table-cell">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          s.isActive !== false
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : 'bg-neutral-200 text-neutral-700 dark:bg-slate-800 dark:text-neutral-400'
                        }`}
                      >
                        {s.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(s);
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        Select
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Empty State */}
              {!loading && suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                    <Truck className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No suppliers found</p>
                    <p className="text-xs text-neutral-400 mb-3">Try changing your search keywords or add as a new vendor.</p>
                    <button
                      type="button"
                      onClick={() => setAddSupplierOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Supplier</span>
                    </button>
                  </td>
                </tr>
              )}

              {/* Loading Spinner */}
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-1" />
                    <p className="text-xs">Loading supplier directory...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="py-2 px-4 bg-neutral-100 dark:bg-slate-800 border-t border-neutral-300 dark:border-slate-700 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 shrink-0">
          <div>
            Showing <span className="font-bold text-neutral-800 dark:text-neutral-200">{suppliers.length}</span> suppliers
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddSupplierOpen(true)}
              className="px-3 py-1 bg-[#006400] hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Supplier</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-1 bg-white dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 border border-neutral-300 dark:border-slate-600 rounded text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      {/* Add Supplier Modal */}
      <SupplierModal
        open={addSupplierOpen}
        onOpenChange={setAddSupplierOpen}
        onSuccess={handleSupplierCreated}
      />
    </>
  );
}
