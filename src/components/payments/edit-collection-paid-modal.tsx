'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { X, Loader2, Search, RotateCcw, Trash2, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import { PartyPayment, Customer, Supplier } from '@/lib/types';

interface EditCollectionPaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: 'SALES' | 'PURCHASE';
  onSuccess?: () => void;
}

export function EditCollectionPaidModal({
  open,
  onOpenChange,
  initialType = 'SALES',
  onSuccess,
}: EditCollectionPaidModalProps) {
  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayYMD = formatDateToYMD(new Date());

  // Form states
  const [reportType, setReportType] = useState<'SALES' | 'PURCHASE'>(initialType);
  const [date, setDate] = useState<string>(todayYMD);
  const [transactionId, setTransactionId] = useState<string>('');
  const [partyCode, setPartyCode] = useState<string>('');
  const [partyName, setPartyName] = useState<string>('');
  const [partyAddress, setPartyAddress] = useState<string>('');
  const [currentDue, setCurrentDue] = useState<number>(0);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [referenceNote, setReferenceNote] = useState<string>('');

  // Loaded party metadata & transaction metadata
  const [partyId, setPartyId] = useState<string>('');
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [originalPaymentAmount, setOriginalPaymentAmount] = useState<number>(0);

  // Status & loading
  const [isSearchingTx, setIsSearchingTx] = useState<boolean>(false);
  const [isSearchingParty, setIsSearchingParty] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (open) {
      setReportType(initialType);
      handleRefresh();
    }
  }, [open, initialType]);

  const handleRefresh = () => {
    setDate(todayYMD);
    setTransactionId('');
    setPartyCode('');
    setPartyName('');
    setPartyAddress('');
    setCurrentDue(0);
    setAmount('');
    setPaymentMethod('CASH');
    setReferenceNote('');
    setPartyId('');
    setEditingPaymentId(null);
    setOriginalPaymentAmount(0);
    setStatusMessage(null);
  };

  // Search transaction by Transaction ID / Receipt Number
  const handleSearchTransaction = async () => {
    const trimmed = transactionId.trim();
    if (!trimmed) {
      setStatusMessage({ text: 'Please enter a Transaction ID to search.', isError: true });
      return;
    }

    setIsSearchingTx(true);
    setStatusMessage(null);

    try {
      const res = await api.get<PartyPayment>(`/payments/by-transaction/${encodeURIComponent(trimmed)}`);
      if (res.data) {
        const p = res.data;
        setEditingPaymentId(p.id);
        setTransactionId(p.receiptNumber);
        setOriginalPaymentAmount(Number(p.amount));
        setAmount(Number(p.amount));
        setPaymentMethod(p.paymentMethod || 'CASH');
        setReferenceNote(p.referenceNote || '');
        if (p.createdAt) {
          setDate(formatDateToYMD(new Date(p.createdAt)));
        }

        if (p.type === 'CUSTOMER_COLLECTION') {
          setReportType('SALES');
          if (p.customer) {
            setPartyId(p.customer.id);
            setPartyCode(p.customer.id.slice(0, 8));
            setPartyName(p.customer.name);
            setPartyAddress(p.customer.address || '');
            setCurrentDue(Number(p.customer.currentDue || 0));
          }
        } else {
          setReportType('PURCHASE');
          if (p.supplier) {
            setPartyId(p.supplier.id);
            setPartyCode(p.supplier.id.slice(0, 8));
            setPartyName(p.supplier.name);
            setPartyAddress(p.supplier.address || '');
            setCurrentDue(Number(p.supplier.currentDue || 0));
          }
        }

        setStatusMessage({
          text: `Loaded transaction ${p.receiptNumber} (${p.type === 'CUSTOMER_COLLECTION' ? 'Customer Collection' : 'Supplier Payment'}). You can edit or delete this entry.`,
          isError: false,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || `Transaction "${trimmed}" not found in database.`,
        isError: true,
      });
    } finally {
      setIsSearchingTx(false);
    }
  };

  // Search customer or supplier by code/phone/name
  const handleSearchParty = async () => {
    const trimmed = partyCode.trim();
    if (!trimmed) {
      setStatusMessage({
        text: `Please enter a ${reportType === 'SALES' ? 'Customer' : 'Supplier'} ID to search.`,
        isError: true,
      });
      return;
    }

    setIsSearchingParty(true);
    setStatusMessage(null);

    try {
      if (reportType === 'SALES') {
        const res = await api.get<Customer>(`/parties/customers/by-code/${encodeURIComponent(trimmed)}`);
        if (res.data) {
          const c = res.data;
          setPartyId(c.id);
          setPartyName(c.name);
          setPartyAddress(c.address || '');
          setCurrentDue(Number(c.currentDue || 0));
          if (!editingPaymentId && (!amount || amount === 0) && Number(c.currentDue) > 0) {
            setAmount(Number(c.currentDue));
          }
          setStatusMessage({ text: `Customer "${c.name}" loaded successfully.`, isError: false });
        }
      } else {
        const res = await api.get<Supplier>(`/parties/suppliers/by-code/${encodeURIComponent(trimmed)}`);
        if (res.data) {
          const s = res.data;
          setPartyId(s.id);
          setPartyName(s.name);
          setPartyAddress(s.address || '');
          setCurrentDue(Number(s.currentDue || 0));
          if (!editingPaymentId && (!amount || amount === 0) && Number(s.currentDue) > 0) {
            setAmount(Number(s.currentDue));
          }
          setStatusMessage({ text: `Supplier "${s.name}" loaded successfully.`, isError: false });
        }
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || `${reportType === 'SALES' ? 'Customer' : 'Supplier'} "${trimmed}" not found.`,
        isError: true,
      });
      setPartyName('');
      setPartyAddress('');
      setCurrentDue(0);
      setPartyId('');
    } finally {
      setIsSearchingParty(false);
    }
  };

  // Calculate dynamic Remaining Due
  const numericAmount = typeof amount === 'number' ? amount : 0;
  const effectiveDueBefore = editingPaymentId ? currentDue + originalPaymentAmount : currentDue;
  const remainingDue = effectiveDueBefore - numericAmount;
  const isExceedingDue = Boolean(partyId && effectiveDueBefore > 0 && numericAmount > effectiveDueBefore);
  const hasNoDue = Boolean(partyId && effectiveDueBefore <= 0);

  // Handle Save / Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partyId) {
      setStatusMessage({
        text: `Please enter and search a valid ${reportType === 'SALES' ? 'Customer' : 'Supplier'} ID.`,
        isError: true,
      });
      return;
    }

    if (hasNoDue) {
      setStatusMessage({
        text: `This ${reportType === 'SALES' ? 'customer' : 'supplier'} has no outstanding ${reportType === 'SALES' ? 'due' : 'payable'} (৳0.00). Cannot proceed with ${reportType === 'SALES' ? 'collection' : 'payout'}.`,
        isError: true,
      });
      return;
    }

    if (numericAmount <= 0) {
      setStatusMessage({ text: 'Please enter a valid payment/collection amount greater than 0.', isError: true });
      return;
    }

    if (isExceedingDue) {
      setStatusMessage({
        text: `${reportType === 'SALES' ? 'Collection' : 'Payout'} amount (৳${numericAmount.toLocaleString()}) cannot exceed the actual ${reportType === 'SALES' ? 'due' : 'payable'} of ৳${effectiveDueBefore.toLocaleString()}.`,
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (editingPaymentId) {
        // Update existing transaction
        await api.put(`/payments/${editingPaymentId}`, {
          amount: numericAmount,
          paymentMethod,
          referenceNote,
          date,
        });
        alert('Transaction updated and ledger balances recalculated successfully!');
      } else {
        // Create new collection or payment
        if (reportType === 'SALES') {
          await api.post('/payments/collect', {
            customerId: partyId,
            amount: numericAmount,
            paymentMethod,
            referenceNote,
            date,
          });
          alert('Customer collection recorded and customer due reduced successfully!');
        } else {
          await api.post('/payments/pay', {
            supplierId: partyId,
            amount: numericAmount,
            paymentMethod,
            referenceNote,
            date,
          });
          alert('Supplier payout recorded and supplier payable reduced successfully!');
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save transaction.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!editingPaymentId) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete transaction "${transactionId}"? This will reverse the ৳${originalPaymentAmount.toLocaleString()} payment and restore the ${reportType === 'SALES' ? 'customer' : 'supplier'} due.`
    );

    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/payments/${editingPaymentId}`);
      alert('Transaction deleted and balance successfully restored!');
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete transaction.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-lg w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Dark Green Banner Header with Drag Handle (Screenshot Aesthetic) */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-2.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/90 block -mb-0.5">
            Edit Collection OR Paid
          </span>
          <h2 className="text-base font-bold text-white tracking-wide pointer-events-none select-none">
            {reportType === 'SALES' ? 'Edit Collection From Customer' : 'Edit Payment To Supplier'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Dialog Form Body */}
      <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
        {/* Top Control Bar: Refresh on left, Date on right */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#a8c2dc] dark:border-slate-800">
          <button
            type="button"
            onClick={handleRefresh}
            className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Refresh
          </button>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-6 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs rounded-xs focus:outline-none"
            />
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
            {statusMessage.text}
          </div>
        )}

        {/* Form Fields Container */}
        <div className="space-y-2.5 bg-[#dbe7f3] dark:bg-slate-800/60 p-3 rounded border border-[#b2c8dc] dark:border-slate-700 shadow-inner">
          {/* Row 1: Select Type */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Select Type
            </label>
            <div className="col-span-8">
              <select
                value={reportType}
                onChange={(e) => {
                  const val = e.target.value as 'SALES' | 'PURCHASE';
                  setReportType(val);
                  handleRefresh();
                  setReportType(val);
                }}
                className="w-full h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="SALES">Sales (Customer Collection)</option>
                <option value="PURCHASE">Purchase (Supplier Payment)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Transaction ID (Pink background input + Search button) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Transaction ID
            </label>
            <div className="col-span-8 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="e.g. COL-2026... or TrxID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchTransaction();
                  }
                }}
                className="flex-1 h-7 px-2 bg-[#ffe4e1] dark:bg-rose-950/40 text-neutral-900 dark:text-neutral-100 border border-rose-300 dark:border-rose-800 rounded-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleSearchTransaction}
                disabled={isSearchingTx}
                className="h-7 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isSearchingTx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Search
              </button>
            </div>
          </div>

          {/* Row 3: Customer/Supplier ID + Search button */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              {reportType === 'SALES' ? 'Customer/Supplier ID' : 'Supplier ID'}
            </label>
            <div className="col-span-8 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Code (e.g. 202), phone, or name"
                value={partyCode}
                onChange={(e) => setPartyCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchParty();
                  }
                }}
                className="flex-1 h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={handleSearchParty}
                disabled={isSearchingParty}
                className="h-7 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isSearchingParty ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                Search
              </button>
            </div>
          </div>

          {/* Row 4: Customer Name / Supplier Name */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              {reportType === 'SALES' ? 'Customer Name' : 'Supplier Name'}
            </label>
            <div className="col-span-8">
              <input
                type="text"
                readOnly
                value={partyName}
                placeholder="Auto-populated upon search"
                className="w-full h-7 px-2 bg-neutral-50 dark:bg-slate-900/60 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-slate-700 rounded-xs font-medium cursor-default focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Address
            </label>
            <div className="col-span-8">
              <input
                type="text"
                readOnly
                value={partyAddress}
                placeholder="Auto-populated upon search"
                className="w-full h-7 px-2 bg-neutral-50 dark:bg-slate-900/60 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-slate-700 rounded-xs text-xs cursor-default focus:outline-none"
              />
            </div>
          </div>

          {/* Row 6: Current Due */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-semibold text-neutral-800 dark:text-neutral-200">
              {reportType === 'SALES' ? 'Current Due' : 'Current Payable'}
            </label>
            <div className="col-span-8 flex items-center gap-2">
              <div className="h-7 px-2 flex items-center bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-mono font-bold rounded-xs min-w-[120px]">
                ৳{effectiveDueBefore.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              {editingPaymentId && (
                <span className="text-[11px] text-muted-foreground italic">
                  (Includes previous payment of ৳{originalPaymentAmount.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Row 7: Collection/Paid Amount */}
          <div className="grid grid-cols-12 items-start gap-2">
            <label className="col-span-4 text-right font-bold text-neutral-900 dark:text-neutral-100 pt-1">
              {reportType === 'SALES' ? 'Collection/Paid' : 'Paid Amount'} (৳) *
            </label>
            <div className="col-span-8 space-y-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={effectiveDueBefore > 0 ? effectiveDueBefore : undefined}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder={hasNoDue ? 'No due outstanding' : 'Enter amount'}
                disabled={hasNoDue}
                className={`w-full h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border-2 rounded-xs font-mono font-bold text-sm focus:outline-none transition-colors ${
                  isExceedingDue
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700'
                    : 'border-emerald-600 dark:border-emerald-500'
                }`}
              />
              {isExceedingDue && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  ⚠ Amount cannot exceed outstanding due of ৳{effectiveDueBefore.toLocaleString('en-US', { minimumFractionDigits: 2 })}!
                </p>
              )}
              {hasNoDue && (
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  ℹ Customer/Supplier has zero due. Collection or payout is not applicable.
                </p>
              )}
            </div>
          </div>

          {/* Row 8: Remaining Due (Real-time dynamic display) */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-semibold text-neutral-800 dark:text-neutral-200">
              Remaining Due
            </label>
            <div className="col-span-8 flex items-center gap-2">
              <div
                className={`h-7 px-2 flex items-center font-mono font-bold rounded-xs min-w-[120px] border ${
                  isExceedingDue
                    ? 'bg-rose-200 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-500'
                    : remainingDue === 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-600'
                }`}
              >
                {isExceedingDue
                  ? 'Exceeds Due!'
                  : `৳${remainingDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </div>
              <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                {isExceedingDue
                  ? 'Cannot proceed with negative due'
                  : remainingDue === 0
                  ? '✓ Fully Cleared'
                  : 'Balance after transaction'}
              </span>
            </div>
          </div>

          {/* Row 9: Payment Method */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Payment Method
            </label>
            <div className="col-span-8">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          {/* Row 10: Reference / Memo Note */}
          <div className="grid grid-cols-12 items-center gap-2">
            <label className="col-span-4 text-right font-medium text-neutral-800 dark:text-neutral-200">
              Reference / Note
            </label>
            <div className="col-span-8">
              <input
                type="text"
                placeholder="Money receipt #, cheque details, or memo note"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full h-7 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 rounded-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions: Save, Delete, Close */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isExceedingDue || hasNoDue}
            className="h-7 px-5 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
            Save
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!editingPaymentId || isSubmitting}
            title={!editingPaymentId ? 'Search a Transaction ID to enable delete' : 'Delete this transaction'}
            className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Delete
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 font-bold text-xs rounded-xs border border-neutral-400 dark:border-slate-600 shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </form>
    </Dialog>
  );
}

