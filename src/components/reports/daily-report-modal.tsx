'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  Printer,
  X,
  Calendar,
  ArrowLeft,
  Search,
  Receipt,
  Building2,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { Company } from '@/lib/types';

interface DailyReportItem {
  sn: number;
  id: string;
  date: string;
  rawDate: string;
  code: string;
  name: string;
  company: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
  invoice: string;
  type: 'SALES' | 'PURCHASE';
  partyName: string;
}

interface DailyReportResponse {
  type: 'SALES' | 'PURCHASE' | 'ALL';
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalQuantity: number;
  count: number;
  storeInfo: {
    storeName: string;
    proprietor: string;
    phone: string;
    address: string;
  };
  items: DailyReportItem[];
}

interface DailyReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyReportModal({ open, onOpenChange }: DailyReportModalProps) {
  // Helper to format Date as YYYY-MM-DD
  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format Date as DD-MM-YYYY
  const formatDateToDMY = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const todayYMD = formatDateToYMD(new Date());

  // Filter States
  const [reportType, setReportType] = useState<'SALES' | 'PURCHASE' | 'ALL'>('SALES');
  const [fromDate, setFromDate] = useState<string>(todayYMD);
  const [toDate, setToDate] = useState<string>(todayYMD);
  const [companyId, setCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);

  // Report Data States
  const [data, setData] = useState<DailyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Load companies on open
  useEffect(() => {
    if (open) {
      loadCompanies();
    } else {
      setIsPreview(false);
    }
  }, [open]);

  const loadCompanies = async () => {
    try {
      const res = await api.get<Company[]>('/companies');
      if (res.data) setCompanies(res.data);
    } catch {
      // Non-blocking
    }
  };

  const fetchReport = async (
    typeParam: string = reportType,
    startParam: string = fromDate,
    endParam: string = toDate,
    compParam: string = companyId
  ) => {
    setLoading(true);
    try {
      const res = await api.get<DailyReportResponse>('/reports/daily-purchase-sales', {
        type: typeParam,
        startDate: startParam || undefined,
        endDate: endParam || undefined,
        companyId: compParam || undefined,
      });
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load daily purchase/sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch report whenever modal opens or any filter property changes
  useEffect(() => {
    if (!open) return;
    if (!fromDate || !toDate || fromDate.length < 10 || toDate.length < 10) return;

    let isCancelled = false;
    setLoading(true);

    api
      .get<DailyReportResponse>('/reports/daily-purchase-sales', {
        type: reportType,
        startDate: fromDate,
        endDate: toDate,
        companyId: companyId || undefined,
      })
      .then((res) => {
        if (!isCancelled && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load daily purchase/sales report:', err);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [open, reportType, fromDate, toDate, companyId]);

  const handleSearch = () => {
    fetchReport(reportType, fromDate, toDate, companyId);
  };

  const handleRefresh = () => {
    setReportType('SALES');
    setFromDate(todayYMD);
    setToDate(todayYMD);
    setCompanyId('');
    fetchReport('SALES', todayYMD, todayYMD, '');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  const totalTaka = data?.totalAmount || 0;
  const items = data?.items || [];
  const store = data?.storeInfo;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-5xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Dark Green Banner Header with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <h2 className="text-lg font-bold text-white tracking-wide pointer-events-none select-none">
          Daily Purchase or Sales
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
          {/* Action Bar (hidden in print) */}
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
                className="bg-[#006400] hover:bg-[#004d00] text-white flex items-center gap-1.5 text-xs font-semibold px-4"
              >
                <Printer className="w-4 h-4" /> Print Report
              </Button>
            </div>
          </div>

          {/* Printable Statement Content */}
          <div className="space-y-4 text-slate-800 dark:text-slate-200 font-sans print:text-black">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-slate-300 dark:border-slate-700">
              <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white print:text-black">
                {store?.storeName || 'M/S M. R. Enterprise'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700">
                {store?.address}
              </p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Phone: {store?.phone} | Proprietor: {store?.proprietor}
              </p>
              <div className="pt-2">
                <span className="inline-block bg-slate-200 dark:bg-slate-800 print:bg-slate-200 text-slate-900 print:text-black text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
                  Daily {reportType === 'SALES' ? 'Sales' : reportType === 'PURCHASE' ? 'Purchase' : 'Purchase & Sales'} Statement
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Period: <span className="font-semibold text-slate-800 dark:text-slate-200">{data?.startDate}</span> to <span className="font-semibold text-slate-800 dark:text-slate-200">{data?.endDate}</span>
              </p>
            </div>

            {/* Printable Table */}
            <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-700 print:border-black border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-900 print:text-black font-bold">
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center w-12">SN</th>
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center w-24">Date</th>
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-left w-28">Code</th>
                  <th className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-left">Name</th>
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-right w-20">Quantity</th>
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-right w-24">Rate</th>
                  <th className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-right w-28">Amount</th>
                  <th className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center w-28">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-slate-200 dark:border-slate-800 print:border-black">
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center">{it.sn}</td>
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center font-mono">{it.date}</td>
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black font-mono font-bold">{it.code}</td>
                    <td className="py-1 px-3 border border-slate-300 dark:border-slate-700 print:border-black font-medium">{it.name}</td>
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-right font-mono">{it.quantity}</td>
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-right font-mono">৳{it.rate.toFixed(2)}</td>
                    <td className="py-1 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-right font-mono font-bold">৳{it.amount.toFixed(2)}</td>
                    <td className="py-1 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-center font-mono text-[11px]">{it.invoice}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No records found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 font-bold text-slate-900 print:text-black">
                  <td colSpan={4} className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-right uppercase">
                    Total Amount:
                  </td>
                  <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black text-right font-mono">
                    {data?.totalQuantity || 0}
                  </td>
                  <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black"></td>
                  <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 print:border-black text-right font-mono text-sm">
                    ৳{totalTaka.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 border border-slate-300 dark:border-slate-700 print:border-black"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* STANDARD DIALOG VIEW (Matches Screenshot Exactly) */
        <div className="p-3 space-y-2">
          {/* Top Controls Bar with soft blue frame */}
          <div className="p-2 bg-[#d7e5f2] dark:bg-slate-800/80 border border-[#b2c8dc] dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            {/* Left Controls: Refresh, Type Select, From Date, To Date, Company Select */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                className="h-6 px-3 bg-[#006400] hover:bg-[#004d00] text-white font-bold text-xs rounded-xs shadow-xs transition-colors flex items-center gap-1 border border-[#004d00]"
              >
                Refresh
              </button>

              {/* Type Select Dropdown */}
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="h-6 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs font-semibold focus:outline-none"
              >
                <option value="SALES">Sales</option>
                <option value="PURCHASE">Purchase</option>
                <option value="ALL">All (Sales &amp; Purchase)</option>
              </select>

              {/* From Date */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-6 px-1.5 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs font-mono focus:outline-none"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-6 px-1.5 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Company Filter Dropdown */}
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="h-6 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none"
              >
                <option value="">--Select Company--</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>
                    {co.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Right Controls: Search, Preview, Close */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="h-6 px-4 bg-[#006400] hover:bg-[#004d00] text-white font-bold text-xs rounded-xs shadow-xs transition-colors border border-[#004d00] disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Search
              </button>

              <button
                type="button"
                onClick={() => setIsPreview(true)}
                disabled={loading || items.length === 0}
                className="h-6 px-3 bg-[#006400] hover:bg-[#004d00] text-white font-bold text-xs rounded-xs shadow-xs transition-colors border border-[#004d00] disabled:opacity-50"
              >
                Preview
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-6 px-3 bg-[#006400] hover:bg-[#004d00] text-white font-bold text-xs rounded-xs shadow-xs transition-colors border border-[#004d00]"
              >
                Close
              </button>
            </div>
          </div>

          {/* Centered Total Display (Screenshot: "Total : 0 Taka") */}
          <div className="text-center py-1">
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-wide">
              Total : {totalTaka.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Taka
            </span>
          </div>

          {/* Table Area with Classic Desktop Grid and Grey Background (Screenshot aesthetic) */}
          <div className="border border-neutral-500 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden">
            <div className="max-h-[460px] min-h-[360px] overflow-y-auto flex flex-col justify-start">
              <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-900">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 font-bold border-b-2 border-neutral-400 dark:border-slate-700 z-10 select-none">
                  <tr>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-center w-12">
                      SN
                    </th>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-center w-24">
                      Date
                    </th>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-left w-28">
                      Code
                    </th>
                    <th className="py-1 px-3 border border-neutral-400 dark:border-slate-700 text-left">
                      Name
                    </th>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-right w-20">
                      Quantity
                    </th>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-right w-24">
                      Rate
                    </th>
                    <th className="py-1 px-3 border border-neutral-400 dark:border-slate-700 text-right w-28">
                      Amount
                    </th>
                    <th className="py-1 px-2 border border-neutral-400 dark:border-slate-700 text-center w-28">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-b border-neutral-300 dark:border-slate-800 transition-colors"
                    >
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 text-center text-neutral-700 dark:text-neutral-300">
                        {it.sn}
                      </td>
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 text-center font-mono text-neutral-800 dark:text-neutral-200">
                        {it.date}
                      </td>
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {it.code}
                      </td>
                      <td className="py-1 px-3 border border-neutral-300 dark:border-slate-700 font-medium text-neutral-900 dark:text-neutral-100">
                        {it.name}
                      </td>
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {it.quantity}
                      </td>
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 text-right font-mono text-neutral-800 dark:text-neutral-200">
                        {it.rate.toFixed(2)}
                      </td>
                      <td className="py-1 px-3 border border-neutral-300 dark:border-slate-700 text-right font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {it.amount.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 border border-neutral-300 dark:border-slate-700 text-center font-mono text-xs text-neutral-700 dark:text-neutral-300">
                        {it.invoice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Blank area filling the rest of the window if few or zero items */}
              <div className="flex-1 min-h-[220px] bg-[#9ca3af] dark:bg-slate-950 w-full flex items-center justify-center">
                {!loading && items.length === 0 && (
                  <span className="text-neutral-100 dark:text-neutral-400 text-xs font-semibold bg-neutral-700/40 px-3 py-1 rounded">
                    No transactions found for the selected period
                  </span>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-white text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading daily records...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}

