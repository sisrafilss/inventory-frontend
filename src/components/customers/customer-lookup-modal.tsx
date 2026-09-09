'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  Search,
  X,
  Loader2,
  Users,
  RotateCcw,
  ArrowRight,
  Phone,
  MapPin,
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface CustomerLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customer: Customer) => void;
  title?: string;
  initialSearch?: string;
}

export function CustomerLookupModal({
  open,
  onOpenChange,
  onSelectCustomer,
  title = 'Select Customer',
  initialSearch = '',
}: CustomerLookupModalProps) {
  // Search & Filter States
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [dueFilter, setDueFilter] = useState<'ALL' | 'HAS_DUE' | 'NO_DUE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Customer List
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

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
      fetchCustomers();
    } else {
      setSearch('');
      setDebouncedSearch('');
      setDueFilter('ALL');
      setStatusFilter('ALL');
      setCustomers([]);
    }
  }, [open, initialSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
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

      const res = await api.get<Customer[]>('/parties/customers', params);
      let list = res.data || [];

      if (dueFilter === 'NO_DUE') {
        list = list.filter((c) => Number(c.currentDue ?? c.openingDue ?? 0) <= 0);
      }

      setCustomers(list);
    } catch (err) {
      console.error('Failed to fetch customers for lookup:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dueFilter]);

  // Refetch when filters change
  useEffect(() => {
    if (!open) return;
    fetchCustomers();
  }, [debouncedSearch, statusFilter, dueFilter, open, fetchCustomers]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDueFilter('ALL');
    setStatusFilter('ALL');
  };

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={true}
      zIndex="z-[75]"
      className="p-0 max-w-4xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
    >
      {/* Top Banner with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none text-white shrink-0"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-300" />
          <span className="font-bold text-sm tracking-wide">{title}</span>
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-600/50 font-mono">
            {customers.length} Customers
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-6 h-6 flex items-center justify-center bg-black/20 hover:bg-red-600 rounded text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
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
              placeholder="Search by Name, Phone, Address, or ID..."
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
              <option value="NO_DUE">Zero Due (Paid)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
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

      {/* Customer Table */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh] bg-white dark:bg-slate-950 select-text"
      >
        <table className="w-full text-left text-xs border-collapse border-b border-neutral-300 dark:border-slate-800">
          <thead className="sticky top-0 bg-[#e2e8f0] dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-400 dark:border-slate-700 shadow-sm z-10 select-none">
            <tr>
              <th className="py-2 px-3 w-28 text-left border-r border-neutral-300 dark:border-slate-700">
                Customer ID
              </th>
              <th className="py-2 px-3 text-left border-r border-neutral-300 dark:border-slate-700">
                Customer Name
              </th>
              <th className="py-2 px-3 w-36 text-left border-r border-neutral-300 dark:border-slate-700">
                Phone Number
              </th>
              <th className="py-2 px-3 text-left border-r border-neutral-300 dark:border-slate-700 hidden sm:table-cell">
                Address
              </th>
              <th className="py-2 px-3 w-28 text-right border-r border-neutral-300 dark:border-slate-700">
                Current Due
              </th>
              <th className="py-2 px-2 w-20 text-center border-r border-neutral-300 dark:border-slate-700 hidden md:table-cell">
                Status
              </th>
              <th className="py-2 px-3 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
            {customers.map((c) => {
              const due = Number(c.currentDue ?? c.openingDue ?? 0);
              const hasDue = due > 0;

              return (
                <tr
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors group"
                >
                  {/* Customer ID */}
                  <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                    <span className="bg-neutral-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-slate-700">
                      {c.id.slice(0, 8)}
                    </span>
                  </td>

                  {/* Customer Name */}
                  <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {c.name}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-neutral-800 dark:text-neutral-200 font-medium">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{c.phone || '—'}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 hidden sm:table-cell text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                    <div className="flex items-center gap-1 truncate">
                      {c.address ? (
                        <>
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
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
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      ৳{due.toFixed(2)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2 px-2 text-center border-r border-neutral-200 dark:border-slate-800 hidden md:table-cell">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        c.isActive !== false
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-slate-800 dark:text-neutral-400'
                      }`}
                    >
                      {c.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(c);
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
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                  <Users className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-2 opacity-60" />
                  <p className="font-semibold text-sm">No customers found</p>
                  <p className="text-xs text-neutral-400">Try changing your search keywords or filters.</p>
                </td>
              </tr>
            )}

            {/* Loading Spinner */}
            {loading && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-1" />
                  <p className="text-xs">Loading customer directory...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Footer */}
      <div className="py-2 px-4 bg-neutral-100 dark:bg-slate-800 border-t border-neutral-300 dark:border-slate-700 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 shrink-0">
        <div>
          Showing <span className="font-bold text-neutral-800 dark:text-neutral-200">{customers.length}</span> customers
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="px-4 py-1 bg-white dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 border border-neutral-300 dark:border-slate-600 rounded text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
}
