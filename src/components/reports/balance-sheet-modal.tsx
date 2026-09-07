'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useLanguage } from '@/lib/context/language-context';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  RotateCcw,
  Printer,
  X,
  Calendar,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface BalanceSheetParticulars {
  previousStock: number;
  totalPurchase: number;
  totalSale: number;
  presentStock: number;
  debitTotal: number;
  creditTotal: number;
  profit: number;
  loss: number;
  isProfit: boolean;
  balancedTotal: number;
}

interface BalanceSheetSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  accountsReceivable: number;
  accountsPayable: number;
  inventoryValuation: number;
  netWorkingCapital: number;
  salesCount: number;
  purchasesCount: number;
  expensesCount: number;
}

interface BalanceSheetStoreInfo {
  storeName: string;
  proprietor: string;
  phone: string;
  address: string;
  memoFooterNote: string;
}

interface BalanceSheetResponse {
  particulars: BalanceSheetParticulars;
  summary: BalanceSheetSummary;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    filterType: string;
  };
  storeInfo: BalanceSheetStoreInfo;
}

interface BalanceSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BalanceSheetModal({ open, onOpenChange }: BalanceSheetModalProps) {
  const { formatMoney } = useLanguage();

  // Helper to format date YYYY-MM-DD
  const formatDateForInput = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateForInput(new Date());
  const firstOfMonthStr = formatDateForInput(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // States
  const [filterType, setFilterType] = useState<string>('Date Wise');
  const [fromDate, setFromDate] = useState<string>(firstOfMonthStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BalanceSheetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Handle filter preset change
  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
    const now = new Date();

    if (type === 'Today') {
      const today = formatDateForInput(now);
      setFromDate(today);
      setToDate(today);
    } else if (type === 'This Week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      setFromDate(formatDateForInput(startOfWeek));
      setToDate(formatDateForInput(new Date()));
    } else if (type === 'This Month') {
      setFromDate(firstOfMonthStr);
      setToDate(todayStr);
    } else if (type === 'This Year') {
      const startOfYear = `${now.getFullYear()}-01-01`;
      setFromDate(startOfYear);
      setToDate(todayStr);
    } else if (type === 'All Time') {
      setFromDate('');
      setToDate('');
    }
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        filterType,
      };
      if (fromDate) params.startDate = fromDate;
      if (toDate) params.endDate = toDate;

      const res = await api.get<BalanceSheetResponse>('/reports/balance-sheet', params);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load balance sheet:', err);
      setError(err.message || 'Failed to calculate Balance Sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBalanceSheet();
    } else {
      setIsPreview(false);
    }
  }, [open]);

  const p = data?.particulars;
  const s = data?.summary;
  const store = data?.storeInfo;

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (num?: number | null, fallbackZero: boolean = true) => {
    if (num === undefined || num === null) return fallbackZero ? '.00' : '';
    if (num === 0 && !fallbackZero) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-4xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Dark Green Banner Header with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none">
          Balance Sheet
        </h2>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isPreview ? (
        /* PRINTABLE PREVIEW VIEW */
        <div className="p-6 bg-white dark:bg-slate-950 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0">
          {/* Action Bar (hidden when printed) */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(false)}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Table
            </Button>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-[#15803d] hover:bg-[#166534] text-white flex items-center gap-1.5 text-xs font-semibold px-4"
              >
                <Printer className="w-4 h-4" /> Print Statement
              </Button>
            </div>
          </div>

          {/* Printable Voucher Content */}
          <div className="space-y-6 text-slate-800 dark:text-slate-200 font-sans print:text-black">
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-slate-300 dark:border-slate-700">
              <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                {store?.storeName || 'M.R. Enterprise & Wholesale Trading'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
                {store?.address}
              </p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Phone: {store?.phone} | Proprietor: {store?.proprietor}
              </p>
              <div className="pt-2">
                <span className="inline-block bg-slate-200 dark:bg-slate-800 print:bg-slate-200 text-slate-900 print:text-black text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                  Stock Trading Account & Balance Sheet
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Statement Period:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {fromDate || 'Initial'} to {toDate || 'Present'}
                </span>
                {' '}({filterType})
              </p>
            </div>

            {/* Trading Table */}
            <div className="border border-slate-300 dark:border-slate-700 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border-b border-slate-300 font-bold text-slate-800 print:text-black">
                    <th className="py-2.5 px-4 border-r border-slate-300 w-1/2">Particulars</th>
                    <th className="py-2.5 px-4 text-right border-r border-slate-300 w-1/4">Debit (BDT)</th>
                    <th className="py-2.5 px-4 text-right w-1/4">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 px-4 border-r border-slate-200 font-medium">Previous Stock (Opening)</td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-200">
                      {formatAmount(p?.previousStock)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-r border-slate-200 font-medium">Total Purchase</td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-200">
                      {formatAmount(p?.totalPurchase)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-400">.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-r border-slate-200 font-medium">Total Sale</td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-200 text-slate-400">.00</td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatAmount(p?.totalSale)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-r border-slate-200 font-medium">Present Stock (Closing)</td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-200 text-slate-400">.00</td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatAmount(p?.presentStock)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-50 font-bold border-t-2 border-b border-slate-300">
                    <td className="py-2 px-4 border-r border-slate-300">Total</td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-300 text-slate-900 dark:text-white">
                      {formatAmount(p?.debitTotal)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-slate-900 dark:text-white">
                      {formatAmount(p?.creditTotal)}
                    </td>
                  </tr>
                  {/* Outcome Row */}
                  <tr className={p?.isProfit ? "bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-300" : "bg-red-50 dark:bg-red-950/40 font-bold text-red-900 dark:text-red-300"}>
                    <td className="py-2 px-4 border-r border-slate-200">
                      {p?.isProfit ? 'Trading Gross Profit' : 'Trading Loss'}
                    </td>
                    <td className="py-2 px-4 text-right font-mono border-r border-slate-200">
                      {p?.isProfit ? formatAmount(p?.profit) : '.00'}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {!p?.isProfit ? formatAmount(p?.loss) : '.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary Breakdown */}
            {s && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 print:bg-slate-100 border border-slate-200">
                  <p className="text-slate-500">Sales Invoices</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{s.salesCount} orders</p>
                </div>
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 print:bg-slate-100 border border-slate-200">
                  <p className="text-slate-500">Purchases</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{s.purchasesCount} bills</p>
                </div>
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 print:bg-slate-100 border border-slate-200">
                  <p className="text-slate-500">Operating Expenses</p>
                  <p className="font-bold text-sm text-amber-700">৳ {formatAmount(s.operatingExpenses)}</p>
                </div>
                <div className="p-2.5 rounded bg-slate-100 dark:bg-slate-900 print:bg-slate-100 border border-slate-200">
                  <p className="text-slate-500">Net Operating Result</p>
                  <p className={`font-bold text-sm ${s.netOperatingIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ৳ {formatAmount(s.netOperatingIncome)}
                  </p>
                </div>
              </div>
            )}

            {/* Memo Footer Note */}
            {store?.memoFooterNote && (
              <p className="text-center text-xs italic text-slate-500 pt-2 border-t border-slate-200">
                "{store.memoFooterNote}"
              </p>
            )}

            {/* Signatures */}
            <div className="pt-12 grid grid-cols-3 gap-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 print:text-black">
              <div>
                <div className="border-t border-slate-400 w-3/4 mx-auto mb-1" />
                <p>Prepared By</p>
              </div>
              <div>
                <div className="border-t border-slate-400 w-3/4 mx-auto mb-1" />
                <p>Audited By</p>
              </div>
              <div>
                <div className="border-t border-slate-400 w-3/4 mx-auto mb-1" />
                <p>Approved By (Proprietor)</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD MODAL VIEW (Matches reference screenshot layout) */
        <div className="p-5 flex flex-col md:flex-row gap-5 max-h-[85vh] overflow-y-auto">
          {/* Left Control Sidebar */}
          <div className="w-full md:w-56 shrink-0 flex flex-col gap-3 p-4 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-inner">
            {/* Refresh Button */}
            <Button
              onClick={fetchBalanceSheet}
              disabled={loading}
              className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm py-2 shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Date Preset Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Filter Preset
              </label>
              <select
                value={filterType}
                onChange={(e) => handleFilterTypeChange(e.target.value)}
                className="w-full h-8 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#15803d]"
              >
                <option value="Date Wise">Date Wise</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
                <option value="All Time">All Time</option>
              </select>
            </div>

            {/* From Date Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> From
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setFilterType('Date Wise');
                }}
                className="h-8 text-xs font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600"
              />
            </div>

            {/* To Date Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> To
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setFilterType('Date Wise');
                }}
                className="h-8 text-xs font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600"
              />
            </div>

            {/* Preview Button */}
            <Button
              onClick={() => setIsPreview(true)}
              className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm py-2 mt-2 shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              Preview
            </Button>

            {/* Close Button */}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-bold text-sm py-2 shadow flex items-center justify-center gap-1.5 transition-all border-none"
            >
              Close
            </Button>

            {/* Quick Status Note */}
            <div className="mt-auto pt-3 border-t border-slate-300 dark:border-slate-700 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-600 dark:text-slate-400">
                {store?.storeName}
              </p>
              <p className="truncate">Tejgaon, Dhaka</p>
            </div>
          </div>

          {/* Right Main Panel - Trading Account Grid */}
          <div className="flex-1 flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded">
                {error}
              </div>
            )}

            {/* The Classic Ledger Grid (Matching screenshot layout) */}
            <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-950 shadow-sm flex-1 flex flex-col justify-between">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                    <th className="py-2 px-3 border-r border-slate-300 dark:border-slate-700 w-1/2">
                      Particulars
                    </th>
                    <th className="py-2 px-3 text-right border-r border-slate-300 dark:border-slate-700 w-1/4">
                      Debit
                    </th>
                    <th className="py-2 px-3 text-right w-1/4">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {/* Previous Stock */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">
                      Previous Stock
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
                      {formatAmount(p?.previousStock)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 dark:text-slate-600">
                      .00
                    </td>
                  </tr>

                  {/* Total Purchase */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">
                      Total Purchase
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold">
                      {formatAmount(p?.totalPurchase)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 dark:text-slate-600">
                      .00
                    </td>
                  </tr>

                  {/* Total Sale */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">
                      Total Sale
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600">
                      .00
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100 font-semibold">
                      {formatAmount(p?.totalSale)}
                    </td>
                  </tr>

                  {/* Present Stock */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">
                      Present Stock
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600">
                      .00
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-slate-100 font-semibold">
                      {formatAmount(p?.presentStock)}
                    </td>
                  </tr>

                  {/* Total Row */}
                  <tr className="bg-slate-100/90 dark:bg-slate-900/90 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <td className="py-2 px-3 border-r border-slate-300 dark:border-slate-700">
                      Total
                    </td>
                    <td className="py-2 px-3 text-right font-mono border-r border-slate-300 dark:border-slate-700">
                      {formatAmount(p?.debitTotal)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {formatAmount(p?.creditTotal)}
                    </td>
                  </tr>

                  {/* Profit or Loss Row - Highlighted like the screenshot blue bar */}
                  <tr className="bg-[#0078d7] text-white font-bold select-none">
                    <td className="py-2.5 px-3 border-r border-blue-400">
                      {p?.isProfit ? 'Profit' : 'Loss'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-blue-400">
                      {p?.isProfit ? formatAmount(p?.profit) : '.00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {!p?.isProfit ? formatAmount(p?.loss) : '.00'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Lower Canvas Space (matching gray visual canvas from WinForms screenshot) */}
              <div className="bg-slate-200/50 dark:bg-slate-900/40 p-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Status:{' '}
                    <strong className={p?.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      {p?.isProfit ? 'PROFITABLE TRADING PERIOD' : 'DEFICIT / LOSS PERIOD'}
                    </strong>
                  </span>
                  <span>
                    Net Difference: <strong>৳ {formatAmount(p?.isProfit ? p?.profit : p?.loss)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPI Stat Badges */}
            {s && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <p className="text-[10px] text-slate-500">Gross Sales</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">৳ {formatAmount(s.revenue)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <p className="text-[10px] text-slate-500">Cost of Goods (COGS)</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">৳ {formatAmount(s.cogs)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <p className="text-[10px] text-slate-500">Operating Expenses</p>
                  <p className="text-xs font-bold text-amber-600">৳ {formatAmount(s.operatingExpenses)}</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
                  <p className="text-[10px] text-slate-500">Net Operating Profit</p>
                  <p className={`text-xs font-bold ${s.netOperatingIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ৳ {formatAmount(s.netOperatingIncome)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

