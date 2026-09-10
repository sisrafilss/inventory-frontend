'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { formatDate } from '@/lib/utils';
import {
  BarChart3,
  Search,
  Calendar,
  FileSpreadsheet,
  Receipt,
  Loader2
} from 'lucide-react';
import { BalanceSheetModal } from '@/components/reports/balance-sheet-modal';
import { DailyReportModal } from '@/components/reports/daily-report-modal';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();

  const [activeReport, setActiveReport] = useState<string>('daily-sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBalanceSheetModalOpen, setIsBalanceSheetModalOpen] = useState(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceLookup, setInvoiceLookup] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/sales';
      const params: any = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (activeReport === 'daily-sales') {
        endpoint = '/reports/daily-sales';
        if (startDate) params.date = startDate;
      } else if (activeReport === 'due-list') {
        endpoint = '/reports/due-list';
      } else if (activeReport === 'warehouse-stock') {
        endpoint = '/reports/warehouse-stock';
      } else if (activeReport === 'daily-purchases') {
        endpoint = '/reports/daily-purchases';
      } else if (activeReport === 'daily-costs') {
        endpoint = '/reports/daily-costs';
      } else if (activeReport === 'profit-by-invoice') {
        endpoint = `/reports/profit-by-invoice/${invoiceLookup || 'SAL-latest'}`;
      } else if (activeReport === 'balance-sheet') {
        endpoint = '/reports/balance-sheet';
      } else if (activeReport === 'inventory') {
        endpoint = '/reports/inventory';
      } else if (activeReport === 'adjustments') {
        endpoint = '/reports/stock-adjustments';
      } else if (activeReport === 'cash') {
        endpoint = '/reports/cash-handover';
      }

      const res = await api.get<any>(endpoint, params);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const reportTabs = [
    { id: 'daily-sales', label: 'Daily Sales Statement' },
    { id: 'due-list', label: 'Due List (AP & AR)' },
    { id: 'warehouse-stock', label: 'Warehouse Stock' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
    { id: 'daily-costs', label: 'Daily Costs / Expenses' },
    { id: 'inventory', label: 'Catalog Stock Status' },
    { id: 'sales', label: 'Sales History' },
    { id: 'cash', label: 'Cash Handover' },
    { id: 'adjustments', label: 'Stock Adjustments' },
    ...(isAdmin
      ? [
          { id: 'profit-by-invoice', label: 'Profit by Invoice (Admin)' },
          { id: 'balance-sheet', label: 'Balance Sheet (Admin)' },
        ]
      : []),
  ];

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">Reports & Commercial Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDailyReportModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[3]" />
              <span>Daily Report (Print)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBalanceSheetModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-[#004d00] text-white border border-[#003300] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-[#003300] transition-colors cursor-pointer uppercase tracking-wider"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 stroke-[3]" />
              <span>Balance Sheet</span>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 px-2 pt-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-1 items-end">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider rounded-t-sm border border-b-0 ${
                activeReport === tab.id
                  ? 'bg-white dark:bg-slate-950 text-[#0056b3] border-neutral-400 dark:border-slate-600 relative top-[1px]'
                  : 'bg-neutral-100 dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-950 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchReport();
            }}
            className="flex flex-wrap items-center gap-3 text-xs"
          >
            {activeReport === 'profit-by-invoice' ? (
              <div className="flex items-center gap-2">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Invoice Ref:</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="e.g. SAL-123456"
                    value={invoiceLookup}
                    onChange={(e) => setInvoiceLookup(e.target.value)}
                    className="w-48 h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
                  />
                </div>
                <button type="submit" className="h-7 px-3 bg-[#0056b3] hover:bg-blue-800 text-white border border-blue-900 font-bold text-xs rounded-xs shadow-sm uppercase tracking-wider">
                  Lookup
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Date Range:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
                />
                <span className="text-neutral-500 font-bold">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
                />
                <button type="submit" className="h-7 px-4 bg-[#0056b3] hover:bg-blue-800 text-white border border-blue-900 font-bold text-xs rounded-xs shadow-sm uppercase tracking-wider ml-2">
                  Load Report
                </button>
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); fetchReport(); }}
                    className="h-7 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Report Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-[#f4f8fc] dark:bg-slate-900 custom-scrollbar p-3">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-neutral-500 font-bold">
              <Loader2 className="w-5 h-5 animate-spin text-[#006400]" />
              Generating Report Data...
            </div>
          ) : !data ? (
            <div className="flex items-center justify-center h-48 text-neutral-500 font-bold">
              No records found for this report.
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* === DAILY SALES / PURCHASES === */}
              {(activeReport === 'daily-sales' || activeReport === 'daily-purchases') && data.summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 p-2 shadow-sm rounded-xs border-l-4 border-l-[#0056b3]">
                      <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Total Amount</span>
                      <h4 className="text-xl font-bold font-mono text-neutral-900 dark:text-white leading-none mt-1">
                        {formatMoney(activeReport === 'daily-sales' ? data.summary.totalSales : data.summary.totalPurchases)}
                      </h4>
                    </div>
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 p-2 shadow-sm rounded-xs border-l-4 border-l-emerald-600">
                      <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Paid Amount</span>
                      <h4 className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 leading-none mt-1">
                        {formatMoney(data.summary.totalPaid)}
                      </h4>
                    </div>
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 p-2 shadow-sm rounded-xs border-l-4 border-l-rose-600">
                      <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Due Amount</span>
                      <h4 className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 leading-none mt-1">
                        {formatMoney(data.summary.totalDue)}
                      </h4>
                    </div>
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 p-2 shadow-sm rounded-xs border-l-4 border-l-amber-500">
                      <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Total Invoices</span>
                      <h4 className="text-xl font-bold font-mono text-neutral-900 dark:text-white leading-none mt-1">
                        {data.summary.invoiceCount}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[700px] border-collapse">
                      <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        <tr>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Invoice No</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Date</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Party</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">Net Total</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">Paid</th>
                          <th className="p-2 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                        {data.invoices?.length === 0 ? (
                          <tr><td colSpan={6} className="p-4 text-center italic text-neutral-500">No records found.</td></tr>
                        ) : data.invoices?.map((inv: any, i: number) => (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono font-bold">{inv.invoiceNumber}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono">{formatDate(inv.createdAt)}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-semibold">{inv.partyName}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-right font-bold">{formatMoney(inv.netAmount || inv.totalAmount)}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-right text-emerald-700 dark:text-emerald-400">{formatMoney(inv.paidAmount)}</td>
                            <td className="p-2 font-mono text-right text-rose-700 dark:text-rose-400">{formatMoney(inv.dueAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === DUE LIST === */}
              {activeReport === 'due-list' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Customers */}
                  <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs">
                    <div className="bg-rose-900 text-white p-2 font-bold uppercase tracking-wider text-xs border-b border-neutral-400 dark:border-slate-600">
                      Accounts Receivable (Customer Dues)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[300px] border-collapse">
                        <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700">
                          <tr>
                            <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Customer Name</th>
                            <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Phone</th>
                            <th className="p-2 text-right">Total Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                          {data.customerDues?.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center italic text-neutral-500">No dues.</td></tr>
                          ) : data.customerDues?.map((d: any, i: number) => (
                            <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                              <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-semibold">{d.name}</td>
                              <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-[10px]">{d.phone || '—'}</td>
                              <td className="p-2 font-mono text-right font-bold text-rose-700 dark:text-rose-400">{formatMoney(d.dueAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Suppliers */}
                  <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs">
                    <div className="bg-blue-900 text-white p-2 font-bold uppercase tracking-wider text-xs border-b border-neutral-400 dark:border-slate-600">
                      Accounts Payable (Supplier Dues)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left min-w-[300px] border-collapse">
                        <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700">
                          <tr>
                            <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Supplier Name</th>
                            <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Phone</th>
                            <th className="p-2 text-right">Total Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                          {data.supplierDues?.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center italic text-neutral-500">No dues.</td></tr>
                          ) : data.supplierDues?.map((d: any, i: number) => (
                            <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                              <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-semibold">{d.name}</td>
                              <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-[10px]">{d.phone || '—'}</td>
                              <td className="p-2 font-mono text-right font-bold text-rose-700 dark:text-rose-400">{formatMoney(d.dueAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === WAREHOUSE STOCK === */}
              {activeReport === 'warehouse-stock' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.map((wh: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs">
                      <div className="bg-[#004d00] text-white p-2 font-bold uppercase tracking-wider text-xs border-b border-neutral-400 dark:border-slate-600 flex justify-between">
                        <span>{wh.warehouseName}</span>
                        <span>{formatMoney(wh.totalStockValue)}</span>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700 shadow-[0_1px_0_#9fbcd6] z-10">
                            <tr>
                              <th className="p-1.5 border-r border-neutral-300 dark:border-slate-700">SKU</th>
                              <th className="p-1.5 border-r border-neutral-300 dark:border-slate-700">Product</th>
                              <th className="p-1.5 text-right">Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                            {wh.stocks?.map((s: any, j: number) => (
                              <tr key={j} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                                <td className="p-1.5 border-r border-neutral-300 dark:border-slate-700 font-mono">{s.productSku}</td>
                                <td className="p-1.5 border-r border-neutral-300 dark:border-slate-700 font-semibold">{s.productName}</td>
                                <td className="p-1.5 font-mono text-right font-bold">{s.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* === PROFIT BY INVOICE (ADMIN) === */}
              {activeReport === 'profit-by-invoice' && isAdmin && (
                <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs overflow-hidden max-w-4xl mx-auto">
                  <div className="bg-[#0056b3] text-white p-3 border-b border-[#004d00] flex flex-wrap gap-4 justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider">Invoice: {data.invoice?.invoiceNumber}</h3>
                      <p className="text-[10px] opacity-80 mt-0.5">Date: {formatDate(data.invoice?.createdAt)} | Customer: {data.invoice?.customer?.name}</p>
                    </div>
                    <div className="bg-white text-[#0056b3] px-3 py-1.5 rounded-xs font-bold text-lg font-mono shadow-sm">
                      Profit: {formatMoney(data.overallProfit)} ({data.overallProfitMargin}%)
                    </div>
                  </div>
                  <div className="overflow-x-auto p-3">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-600 uppercase tracking-wider">
                        <tr>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Product</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center">Qty</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">Avg Cost</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">Unit Sold At</th>
                          <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">Line Profit</th>
                          <th className="p-2 text-right">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                        {data.lineItems?.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50 font-mono">
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-sans font-semibold">{item.productName}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center">{item.quantity}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right text-muted-foreground">{formatMoney(item.unitCostAtSale)}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right">{formatMoney(item.unitPrice)}</td>
                            <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(item.lineProfit)}</td>
                            <td className="p-2 text-right font-bold text-blue-700 dark:text-blue-400">{item.profitMargin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === BALANCE SHEET (ADMIN) === */}
              {activeReport === 'balance-sheet' && isAdmin && (
                <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                  <div className="text-center border-b border-neutral-400 dark:border-slate-600 pb-4">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Executive Financial Statement</h2>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Operating Performance & Working Capital</p>
                  </div>
                  
                  <div className="space-y-4 text-sm font-sans">
                    <div className="bg-[#f4f8fc] dark:bg-slate-900 border border-[#9fbcd6] dark:border-slate-700 rounded-xs p-3">
                      <h4 className="font-bold text-[#0056b3] uppercase tracking-wider mb-2 border-b border-[#9fbcd6] dark:border-slate-700 pb-1">1. Trading & Operating Income</h4>
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between p-1"><span>Gross Sales Revenue:</span> <span className="font-bold">{formatMoney(data.revenue)}</span></div>
                        <div className="flex justify-between p-1"><span>Cost of Goods Sold (COGS):</span> <span className="text-rose-700 dark:text-rose-400">({formatMoney(data.cogs)})</span></div>
                        <div className="flex justify-between p-1 bg-emerald-100/50 dark:bg-emerald-900/20 font-bold text-emerald-800 dark:text-emerald-300 border-y border-emerald-200 dark:border-emerald-800">
                          <span>Gross Operating Profit:</span> <span>{formatMoney(data.grossProfit)}</span>
                        </div>
                        <div className="flex justify-between p-1"><span>Operating Costs (Expenses):</span> <span className="text-rose-700 dark:text-rose-400">({formatMoney(data.operatingExpenses)})</span></div>
                        <div className="flex justify-between p-1.5 mt-2 bg-neutral-200 dark:bg-slate-800 font-bold text-sm">
                          <span>Net Operating Income:</span> 
                          <span className={Number(data.netOperatingIncome) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                            {formatMoney(data.netOperatingIncome)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#fffdf0] dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded-xs p-3">
                      <h4 className="font-bold text-[#800000] dark:text-amber-500 uppercase tracking-wider mb-2 border-b border-amber-300 dark:border-slate-700 pb-1">2. Working Capital & Current Assets</h4>
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between p-1"><span>Accounts Receivable (Customer Dues):</span> <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(data.accountsReceivable)}</span></div>
                        <div className="flex justify-between p-1"><span>Current Inventory Valuation:</span> <span className="font-bold">{formatMoney(data.inventoryValuation)}</span></div>
                        <div className="flex justify-between p-1"><span>Accounts Payable (Supplier Dues):</span> <span className="text-rose-700 dark:text-rose-400 font-bold">({formatMoney(data.accountsPayable)})</span></div>
                        <div className="flex justify-between p-1.5 mt-2 bg-[#800000] text-white font-bold text-sm">
                          <span>Net Working Capital:</span> 
                          <span>{formatMoney(data.netWorkingCapital)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === FALLBACK GENERIC TABLE FOR OTHERS === */}
              {Array.isArray(data) && activeReport !== 'warehouse-stock' && (
                <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[600px] border-collapse">
                    <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-600 uppercase tracking-wider">
                      <tr>
                        {data.length > 0 &&
                          Object.keys(data[0])
                            .filter((k) => k !== 'id')
                            .slice(0, 7)
                            .map((key) => (
                              <th key={key} className="p-2 border-r border-neutral-300 dark:border-slate-700">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                      {data.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                          {Object.keys(row)
                            .filter((k) => k !== 'id')
                            .slice(0, 7)
                            .map((key) => (
                              <td key={key} className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono">
                                {typeof row[key] === 'boolean'
                                  ? row[key] ? 'Yes' : 'No'
                                  : typeof row[key] === 'number'
                                  ? row[key].toLocaleString()
                                  : String(row[key] || '—')}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BalanceSheetModal open={isBalanceSheetModalOpen} onOpenChange={setIsBalanceSheetModalOpen} />
      <DailyReportModal open={isDailyReportModalOpen} onOpenChange={setIsDailyReportModalOpen} />
    </div>
  );
}
