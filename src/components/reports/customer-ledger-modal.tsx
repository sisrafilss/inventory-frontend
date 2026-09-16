'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/utils';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User,
  Calendar,
  Printer,
  Download,
  Search,
  Loader2,
  FileSpreadsheet,
  X,
  Building2,
  Phone,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerLedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomerId?: string;
}

export function CustomerLedgerModal({
  open,
  onOpenChange,
  initialCustomerId,
}: CustomerLedgerModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<any>(null);

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (open && selectedCustomerId) {
      fetchLedger();
    }
  }, [open, selectedCustomerId, startDate, endDate]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get<any>('/parties/customers?limit=200');
      const list = res.data?.customers || res.data || [];
      setCustomers(list);
      if (!selectedCustomerId && list.length > 0) {
        setSelectedCustomerId(list[0].id);
      }
    } catch {
      // Non-blocking
    }
  };

  const fetchLedger = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      const params: any = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await api.get<any>(`/reports/customer-ledger/${selectedCustomerId}`, params);
      setLedgerData(res.data);
    } catch (err: any) {
      toast.error('Failed to load customer ledger statement.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!ledgerData || !ledgerData.ledgerEntries || ledgerData.ledgerEntries.length === 0) {
      toast.warning('No ledger entries to export');
      return;
    }

    const headers = ['Date', 'Type', 'Reference', 'Description', 'Debit (+Due)', 'Credit (-Due)', 'Running Balance'];
    const rows = ledgerData.ledgerEntries.map((e: any) => [
      `"${e.date}"`,
      `"${e.type}"`,
      `"${e.reference}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.debit}"`,
      `"${e.credit}"`,
      `"${e.balance}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Ledger_${ledgerData.customer?.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customer Ledger exported to CSV!');
  };

  const customer = ledgerData?.customer;
  const entries: any[] = ledgerData?.ledgerEntries || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="p-0 max-w-4xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl text-xs text-neutral-900 dark:text-neutral-100 select-none">
        
        {/* Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-200" />
            <h2 className="text-base font-bold tracking-wide">Customer Ledger Statement (কাস্টমার খতিয়ান ও লেনদেন স্টেটমেন্ট)</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center shadow transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Customer Select */}
        <div className="p-3 bg-[#eaf1f8] dark:bg-slate-800/80 border-b border-neutral-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <label className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0">Select Customer:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 max-w-xs h-8 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 rounded-xs"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} - Due: ৳{c.currentDue}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 border border-neutral-400 dark:border-slate-600 rounded-xs">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs focus:outline-none"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold hover:bg-neutral-100 rounded-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-7 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statement Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Customer Metadata Card Header */}
          {customer && (
            <div className="bg-[#f4f8fc] dark:bg-slate-800/60 p-3 rounded border border-neutral-300 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-500">Customer Name & Code</div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {customer.name}
                </div>
                <div className="font-mono text-xs text-neutral-500">Code: {customer.code || '—'}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-500">Phone & Address</div>
                <div className="font-medium text-neutral-800 dark:text-neutral-200 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" /> {customer.phone || 'N/A'}
                </div>
                <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" /> {customer.address || 'N/A'}
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-300 dark:border-slate-700 pt-2 sm:pt-0 sm:pl-3">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Current Outstanding Dues</div>
                <div className="font-mono font-bold text-lg text-red-600 dark:text-red-400 mt-0.5">
                  {formatMoney(customer.currentDue)}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Opening Balance: {formatMoney(customer.openingBalance)}
                </div>
              </div>
            </div>
          )}

          {/* Ledger Running Balance Table */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                <tr>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-24 text-center">Date</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-20 text-center">Type</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">Ref #</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700">Transaction Details</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Debit (+Due)</th>
                  <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Credit (-Paid)</th>
                  <th className="py-2 px-3 text-right w-32">Balance (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500 font-medium">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                      Loading customer ledger entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400 font-medium">
                      No ledger transactions found for this customer.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-neutral-50 dark:hover:bg-slate-900/60 transition-colors">
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-500">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-[11px]">
                        {entry.date}
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                          entry.type === 'SALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          entry.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {entry.reference}
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-neutral-700 dark:text-neutral-300">
                        {entry.description}
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono text-red-600 font-bold">
                        {entry.debit > 0 ? formatMoney(entry.debit) : '—'}
                      </td>
                      <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        {entry.credit > 0 ? formatMoney(entry.credit) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatMoney(entry.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {entries.length > 0 && (
                <tfoot className="bg-neutral-100 dark:bg-slate-900 font-bold border-t-2 border-neutral-400 dark:border-slate-700">
                  <tr>
                    <td colSpan={5} className="py-2 px-3 text-right uppercase">
                      Final Customer Due Balance:
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-red-600">
                      {formatMoney(entries.reduce((acc, e) => acc + e.debit, 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {formatMoney(entries.reduce((acc, e) => acc + e.credit, 0))}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-base text-red-600 dark:text-red-400">
                      {formatMoney(ledgerData?.finalBalance)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
