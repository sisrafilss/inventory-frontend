'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  X,
  Loader2,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api/client';

export interface PartyPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'PAY' | 'COLLECT'; // PAY = Pay Supplier Due, COLLECT = Collect Customer Cash
  party: {
    id: string;
    name: string;
    phone?: string;
    due: number;
  } | null;
  onSuccess?: () => void;
}

export function PartyPaymentModal({
  open,
  onOpenChange,
  type,
  party,
  onSuccess,
}: PartyPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNote, setReferenceNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && party) {
      // Default amount to full due if positive, else 0
      const currentDue = Number(party.due) || 0;
      setAmount(currentDue > 0 ? currentDue : 0);
      setPaymentMethod('CASH');
      setReferenceNote('');
      setStatusMessage(null);
      setTimeout(() => amountInputRef.current?.focus(), 80);
    } else {
      setStatusMessage(null);
      setIsProcessing(false);
    }
  }, [open, party]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party) return;

    if (amount <= 0) {
      setStatusMessage({
        text: 'Payment amount must be greater than 0.',
        isError: true,
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      if (type === 'PAY') {
        await api.post('/payments/supplier-payment', {
          supplierId: party.id,
          amount: Number(amount),
          paymentMethod,
          referenceNote: referenceNote.trim() || undefined,
        });
        setStatusMessage({
          text: `Payment of ৳${amount.toLocaleString()} to ${party.name} recorded successfully!`,
          isError: false,
        });
      } else {
        await api.post('/payments/customer-collection', {
          customerId: party.id,
          amount: Number(amount),
          paymentMethod,
          referenceNote: referenceNote.trim() || undefined,
        });
        setStatusMessage({
          text: `Collection of ৳${amount.toLocaleString()} from ${party.name} recorded successfully!`,
          isError: false,
        });
      }

      if (onSuccess) onSuccess();
      setTimeout(() => onOpenChange(false), 400);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to process transaction. Please try again.',
        isError: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open || !party) return null;

  const isPay = type === 'PAY';

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => !isProcessing && onOpenChange(val)}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-md w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Top Banner Header with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/90 block -mb-0.5">
            {isPay ? 'Supplier Due Settlement' : 'Customer Cash Collection'}
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none flex items-center justify-center gap-1.5">
            {isPay ? (
              <TrendingDown className="w-4 h-4 text-rose-300" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-300" />
            )}
            {isPay ? 'Pay Supplier Due' : 'Collect Cash from Customer'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isProcessing}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Close"
          title="Close window"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
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

        {/* Party Info Summary Box */}
        <div className="bg-[#b9d2e8] dark:bg-slate-800/80 p-2.5 rounded-xs border border-[#a2c2dc] dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              {party.name}
            </div>
            {party.phone && (
              <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                {party.phone}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-neutral-600 dark:text-neutral-400 font-semibold uppercase">
              {isPay ? 'Outstanding Balance (We Owe)' : 'Receivable Balance (Owed)'}
            </div>
            <div
              className={`text-base font-bold font-mono ${
                isPay ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              ৳{Number(party.due).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Structured Inputs Card */}
        <div className="space-y-2.5 bg-[#dbe7f3] dark:bg-slate-800/60 p-3.5 rounded border border-[#b2c8dc] dark:border-slate-700 shadow-inner">
          {/* Amount Field */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Amount (৳) <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <input
                ref={amountInputRef}
                type="number"
                min="1"
                step="any"
                required
                placeholder="0.00"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                disabled={isProcessing}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 font-bold font-mono"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Payment Method <span className="text-rose-600 font-bold">*</span>
            </label>
            <div className="col-span-8">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isProcessing}
                className="w-full h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 font-medium"
              >
                <option value="CASH">Cash (নগদ)</option>
                <option value="BKASH">bKash (বিকাশ)</option>
                <option value="NAGAD">Nagad (নগদ)</option>
                <option value="BANK_TRANSFER">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                <option value="CHEQUE">Cheque (চেক)</option>
              </select>
            </div>
          </div>

          {/* Reference / Memo */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Reference Note <span className="text-[10px] text-neutral-500 font-normal">(Optional)</span>
            </label>
            <div className="col-span-8">
              <input
                type="text"
                placeholder="e.g. Receipt #104, TrxID, Cheque #"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                disabled={isProcessing}
                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a8c2dc] dark:border-slate-800">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isProcessing}
            className={`h-7 px-4 text-white font-bold text-xs rounded-xs border shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isPay
                ? 'bg-rose-700 hover:bg-rose-800 border-rose-900'
                : 'bg-[#006400] hover:bg-emerald-800 border-[#004d00]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isPay ? 'Confirm Supplier Payout' : 'Confirm Cash Collection'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

