'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Edit2,
  Calendar,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Customer } from '@/lib/types';

export interface CustomerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
  onCollect?: (customer: Customer) => void;
}

export function CustomerDetailsModal({
  open,
  onOpenChange,
  customer,
  onEdit,
  onCollect,
}: CustomerDetailsModalProps) {
  if (!customer) return null;

  const dueAmount = Number(customer.currentDue) || 0;
  const openingDue = Number(customer.openingDue) || 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={true}
      className="p-0 max-w-xl w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Dark Green Banner Header with Draggable Handle */}
      <div
        data-drag-handle
        className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none text-white"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-lime-300 shrink-0" />
          <h2 className="text-base font-bold tracking-wide pointer-events-none select-none">
            Customer Details
          </h2>
          {customer.code && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-100 border border-emerald-600 font-mono text-xs font-bold">
              #{customer.code}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-4 space-y-3 text-xs">
        {/* Top Summary Card */}
        <div className="bg-white dark:bg-slate-800 p-3.5 border border-neutral-400 dark:border-slate-600 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {customer.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider ${
                  customer.isActive
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {customer.companyName && (
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-medium">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>
                  Company / Firm:{' '}
                  <strong className="text-neutral-900 dark:text-neutral-100">
                    {customer.companyName}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="text-right pl-4 border-l border-neutral-200 dark:border-slate-700 shrink-0">
            <span className="text-[10px] text-neutral-500 font-semibold block uppercase tracking-wider">
              Current Due
            </span>
            <span
              className={`text-base font-mono font-bold block ${
                dueAmount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ৳{dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 2-Column Information Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* General & Contact Information */}
          <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm space-y-2">
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] border-b border-neutral-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span>Contact & Identity</span>
            </h3>
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Customer ID / Code:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {customer.code ? `#${customer.code}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Phone Number:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {customer.phone || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Email Address:</span>
                <span className="text-neutral-900 dark:text-neutral-100">
                  {customer.email || '—'}
                </span>
              </div>
              <div className="flex justify-between items-start py-0.5">
                <span className="text-neutral-500 font-semibold shrink-0">Address:</span>
                <span className="text-right text-neutral-900 dark:text-neutral-100 font-medium pl-2">
                  {customer.address || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial & Transaction Information */}
          <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm space-y-2">
            <h3 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] border-b border-neutral-200 dark:border-slate-700 pb-1 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span>Financial Summary</span>
            </h3>
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Opening Due:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  ৳{openingDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Current Balance:</span>
                <span
                  className={`font-mono font-bold ${
                    dueAmount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  ৳{dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-neutral-100 dark:border-slate-700/50">
                <span className="text-neutral-500 font-semibold">Total Invoices:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {customer._count?.sales ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-neutral-500 font-semibold">Payment Records:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {customer._count?.payments ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-300 dark:border-slate-700">
          <div>
            {dueAmount > 0 && onCollect && (
              <button
                type="button"
                onClick={() => {
                  const cust = customer;
                  onOpenChange(false);
                  onCollect(cust);
                }}
                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Collect payment from customer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Collect Due</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const cust = customer;
                onOpenChange(false);
                onEdit(cust);
              }}
              className="h-7 px-4 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Edit customer details"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Customer</span>
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
