'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { formatDate, formatMoney } from '@/lib/utils';
import {
  BarChart3,
  Search,
  Calendar,
  FileSpreadsheet,
  Receipt,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { BalanceSheetModal } from '@/components/reports/balance-sheet-modal';
import { DailyReportModal } from '@/components/reports/daily-report-modal';
import { BIAnalyticsBuilder } from '@/components/reports/bi-analytics-builder';
import { CustomerLedgerModal } from '@/components/reports/customer-ledger-modal';
import { StockAgingReorderModal, StockAgingReportView } from '@/components/reports/stock-aging-reorder-modal';
import { User, Clock, AlertTriangle, Zap, Warehouse, Eye, Edit2, Barcode as BarcodeIcon, Building2, Package, Layers, Boxes, TrendingUp, DollarSign, Printer, RefreshCw } from 'lucide-react';
import { ProductDetailsModal } from '@/components/products/product-details-modal';
import { ProductEditModal } from '@/components/products/product-edit-modal';
import { BarcodePrintModal } from '@/components/products/barcode-print-modal';
import { Product } from '@/lib/types';
import { formatStock, formatUnitLabel } from '@/lib/stock-utils';

const REPORT_CATEGORIES = [
  {
    id: 'inventory',
    label: 'Stock & Godowns',
    icon: Boxes,
    reports: [
      { id: 'warehouse-stock', label: 'Warehouse Stock', desc: 'গুদাম ভিত্তিক স্টক ও হিসাব' },
      { id: 'inventory', label: 'Catalog Stock Status', desc: 'সকল পণ্যের মজুদ স্থিতি' },
      { id: 'reorder-aging', label: 'Stock Alerts & Aging', desc: 'মজুদ সতর্কতা ও মেয়াদ' },
      { id: 'adjustments', label: 'Stock Adjustments', desc: 'স্টক সমন্বয় ও সংশোধন' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Commercial',
    icon: ShoppingCart,
    reports: [
      { id: 'daily-sales', label: 'Daily Sales Statement', desc: 'দৈনিক বিক্রয় বিবরণী' },
      { id: 'sales', label: 'Sales History', desc: 'সকল বিক্রয় চালান ইতিহাস' },
      { id: 'user-performance', label: 'Salesperson Performance', desc: 'বিক্রয় প্রতিনিধি কার্যক্ষমতা' },
      { id: 'profit-by-invoice', label: 'Profit by Invoice (Admin)', desc: 'চালান ভিত্তিক মুনাফা', adminOnly: true },
    ],
  },
  {
    id: 'dues',
    label: 'Dues & Ledger',
    icon: Receipt,
    reports: [
      { id: 'due-list', label: 'Due List (AP & AR)', desc: 'গ্রাহক ও সাপ্লায়ার বাকি তালিকা' },
      { id: 'customer-ledger', label: 'Customer Ledger Statement', desc: 'গ্রাহক লেজার খতিয়ান' },
      { id: 'daily-purchases', label: 'Daily Purchases', desc: 'দৈনিক ক্রয় বিবরণী' },
    ],
  },
  {
    id: 'financials',
    label: 'Financials & Cash',
    icon: DollarSign,
    reports: [
      { id: 'balance-sheet', label: 'Executive Balance Sheet (Admin)', desc: 'ব্যবসায়িক স্থিতিপত্র', adminOnly: true },
      { id: 'daily-costs', label: 'Daily Costs / Expenses', desc: 'দৈনিক পরিচালন খরচ' },
      { id: 'cash', label: 'Cash Handover', desc: 'দৈনিক নগদ ক্যাশ হিসাব' },
    ],
  },
  {
    id: 'analytics',
    label: 'BI Analytics',
    icon: BarChart3,
    reports: [
      { id: 'bi-analytics', label: 'BI Analytics & Custom Builder', desc: 'কাস্টম চার্ট ও অ্যানালিটিক্স' },
    ],
  },
];

function ReportsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const categories = REPORT_CATEGORIES.map((cat) => ({
    ...cat,
    reports: cat.reports.filter((r) => !r.adminOnly || isAdmin),
  })).filter((cat) => cat.reports.length > 0);

  const [activeReport, setActiveReport] = useState<string>(urlTab || 'warehouse-stock');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const initTab = urlTab || 'warehouse-stock';
    const found = categories.find((cat) => cat.reports.some((r) => r.id === initTab));
    return found ? found.id : 'inventory';
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBalanceSheetModalOpen, setIsBalanceSheetModalOpen] = useState(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isStockAgingModalOpen, setIsStockAgingModalOpen] = useState(false);
  const [stockAgingTab, setStockAgingTab] = useState<'reorder' | 'aging' | 'velocity' | 'user'>('reorder');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [dueListSrGroup, setDueListSrGroup] = useState<string>('ALL');

  // Warehouse Stock Report States
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [warehouseStockSearch, setWarehouseStockSearch] = useState<string>('');
  const [warehouseStockStatus, setWarehouseStockStatus] = useState<string>('ALL');
  const [selectedStockRowId, setSelectedStockRowId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [availableWarehouses, setAvailableWarehouses] = useState<{ id: string; name: string; address?: string | null }[]>([]);

  // Load available warehouses for selector
  useEffect(() => {
    if (activeReport === 'warehouse-stock') {
      api.get<any[]>('/warehouses')
        .then((res) => {
          if (res.data) {
            setAvailableWarehouses(res.data.map((w: any) => ({ id: w.id, name: w.name, address: w.address })));
          }
        })
        .catch(() => {});
    }
  }, [activeReport]);

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
        if (dueListSrGroup && dueListSrGroup !== 'ALL') {
          params.srGroup = dueListSrGroup;
        }
      } else if (activeReport === 'warehouse-stock') {
        endpoint = '/reports/warehouse-stock';
        if (selectedWarehouseId && selectedWarehouseId !== 'ALL') {
          params.warehouseId = selectedWarehouseId;
        }
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

  // Automatically fetch report whenever activeReport or relevant filters change
  useEffect(() => {
    if (
      activeReport === 'customer-ledger' ||
      activeReport === 'reorder-aging' ||
      activeReport === 'user-performance' ||
      activeReport === 'bi-analytics'
    ) {
      setLoading(false);
      return;
    }
    fetchReport();
  }, [activeReport, selectedWarehouseId, dueListSrGroup, startDate, endDate]);

  // Sync when urlTab changes (e.g. from sidebar clicks)
  useEffect(() => {
    if (urlTab) {
      if (urlTab === 'customer-ledger') {
        setIsCustomerLedgerOpen(true);
        return;
      }
      setActiveReport(urlTab);
      const parent = categories.find((cat) => cat.reports.some((r) => r.id === urlTab));
      if (parent) {
        setSelectedCategory(parent.id);
      }
    }
  }, [urlTab]);

  const handleSelectReport = (tabId: string) => {
    if (tabId === 'customer-ledger') {
      setIsCustomerLedgerOpen(true);
      return;
    }
    setActiveReport(tabId);
    const parent = categories.find((cat) => cat.reports.some((r) => r.id === tabId));
    if (parent) {
      setSelectedCategory(parent.id);
    }
    window.history.replaceState(null, '', `/reports?tab=${tabId}`);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat && !cat.reports.some((r) => r.id === activeReport)) {
      handleSelectReport(cat.reports[0].id);
    }
  };

  const activeCategoryObj =
    categories.find((cat) => cat.id === selectedCategory) ||
    categories.find((cat) => cat.reports.some((r) => r.id === activeReport)) ||
    categories[0];

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-emerald-200" />
            <h1 className="text-sm sm:text-base font-bold tracking-wide flex items-center gap-2">
              <span>Reports & Commercial Analytics</span>
              <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-400/40 text-emerald-200">
                {activeCategoryObj.label}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCustomerLedgerOpen(true)}
              className="px-2 py-1 text-xs font-bold bg-white text-emerald-800 border border-emerald-500 shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
              title="Open Customer Ledger Statement"
            >
              <User className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden md:inline">Customer Ledger</span>
              <span className="md:hidden">Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectReport('reorder-aging')}
              className="px-2 py-1 text-xs font-bold bg-[#800000] text-white border border-rose-800 shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-rose-900 transition-colors cursor-pointer uppercase tracking-wider"
              title="Open Stock Alerts & Aging"
            >
              <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden md:inline">Stock Alerts</span>
              <span className="md:hidden">Alerts</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDailyReportModalOpen(true)}
              className="px-2 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
              title="Print Daily Summary Report"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden md:inline">Daily Report</span>
              <span className="md:hidden">Daily</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsBalanceSheetModalOpen(true)}
                className="px-2 py-1 text-xs font-bold bg-[#004d00] text-white border border-emerald-600 shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-[#003800] transition-colors cursor-pointer uppercase tracking-wider"
                title="Open Executive Balance Sheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden md:inline">Balance Sheet</span>
                <span className="md:hidden">Sheet</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Module Sub-Reports Tab Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 px-3 pt-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex items-end gap-1.5 overflow-x-auto custom-scrollbar">
          {activeCategoryObj.reports.map((tab) => {
            const isTabActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectReport(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all uppercase tracking-wider rounded-t-xs border border-b-0 cursor-pointer shrink-0 ${
                  isTabActive
                    ? 'bg-white dark:bg-slate-950 text-[#0056b3] dark:text-blue-400 border-neutral-400 dark:border-slate-600 relative top-[1px] shadow-xs'
                    : 'bg-neutral-100 dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-white/80 dark:hover:bg-slate-800'
                }`}
                title={tab.desc}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        {activeReport !== 'reorder-aging' && activeReport !== 'user-performance' && activeReport !== 'bi-analytics' && (
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
            ) : activeReport === 'due-list' ? (
              <div className="flex flex-wrap items-center gap-2">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Filter by Group SR:</span>
                </label>
                <select
                  value={dueListSrGroup}
                  onChange={(e) => setDueListSrGroup(e.target.value)}
                  className="h-7 px-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3] font-medium"
                >
                  <option value="ALL">All Groups / SRs (সকল এসআর গ্রুপ)</option>
                  {(data?.srGroups || []).map((grp: string) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
                {dueListSrGroup !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setDueListSrGroup('ALL')}
                    className="h-7 px-2.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={fetchReport}
                  className="h-7 px-3 bg-[#0056b3] hover:bg-blue-800 text-white border border-blue-900 font-bold text-xs rounded-xs shadow-sm uppercase tracking-wider ml-1 cursor-pointer"
                >
                  Reload
                </button>
              </div>
            ) : activeReport === 'warehouse-stock' ? (
              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" />
                    <span>Godown / Warehouse:</span>
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="h-7 px-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400] font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="ALL">All Warehouses / Godowns (সকল গুদাম)</option>
                    {availableWarehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} {wh.address ? `(${wh.address})` : ''}
                      </option>
                    ))}
                  </select>

                  <div className="relative ml-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search product, SKU, barcode, company..."
                      value={warehouseStockSearch}
                      onChange={(e) => setWarehouseStockSearch(e.target.value)}
                      className="w-60 h-7 pl-7 pr-6 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                    />
                    {warehouseStockSearch && (
                      <button
                        type="button"
                        onClick={() => setWarehouseStockSearch('')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <label className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider ml-1">
                    Status:
                  </label>
                  <select
                    value={warehouseStockStatus}
                    onChange={(e) => setWarehouseStockStatus(e.target.value)}
                    className="h-7 px-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400] font-medium"
                  >
                    <option value="ALL">All Stock Statuses</option>
                    <option value="IN_STOCK">In Stock (পর্যাপ্ত)</option>
                    <option value="LOW_STOCK">Low Stock (সতর্কতা)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (শূন্য)</option>
                  </select>

                  {(warehouseStockSearch || warehouseStockStatus !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setWarehouseStockSearch('');
                        setWarehouseStockStatus('ALL');
                      }}
                      className="h-7 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-xs cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchReport}
                    disabled={loading}
                    className="h-7 px-3 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-xs rounded-xs shadow-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Reload Stock</span>
                  </button>
                </div>
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
        )}

        {/* Report Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-[#f4f8fc] dark:bg-slate-900 custom-scrollbar p-3">
          {activeReport === 'bi-analytics' ? (
            <BIAnalyticsBuilder />
          ) : activeReport === 'reorder-aging' || activeReport === 'user-performance' ? (
            <StockAgingReportView
              initialTab={activeReport === 'user-performance' ? 'user' : 'reorder'}
              embedded={true}
            />
          ) : loading ? (
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
                <div className="space-y-3">
                  {/* Filter Status Notification Badge if SR is filtered */}
                  {dueListSrGroup !== 'ALL' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2 text-xs rounded-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-medium">
                      <span>
                        Filtered by SR Group:{' '}
                        <strong className="underline font-bold text-emerald-950 dark:text-emerald-100 font-mono">
                          {dueListSrGroup}
                        </strong>
                      </span>
                      <span className="font-mono font-bold">
                        Filtered Customer Due: {formatMoney(data?.totalCustomerDue || 0)}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Customers */}
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs">
                      <div className="bg-rose-900 text-white p-2 font-bold uppercase tracking-wider text-xs border-b border-neutral-400 dark:border-slate-600 flex justify-between items-center">
                        <span>
                          Accounts Receivable (Customer Dues)
                          {dueListSrGroup !== 'ALL' ? ` — [${dueListSrGroup}]` : ''}
                        </span>
                        <span className="font-mono font-bold">
                          {formatMoney(data?.totalCustomerDue || 0)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left min-w-[340px] border-collapse">
                          <thead className="bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700">
                            <tr>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Customer Name</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Phone</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700">SR / Group</th>
                              <th className="p-2 text-right">
                                {dueListSrGroup !== 'ALL' ? `${dueListSrGroup} Due` : 'Total Due'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                            {(!data?.customerDues || data.customerDues.length === 0) ? (
                              <tr><td colSpan={4} className="p-4 text-center italic text-neutral-500">No dues found for this selection.</td></tr>
                            ) : data.customerDues.map((d: any, i: number) => (
                              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-semibold">
                                  {d.name}
                                  {d.companyName && (
                                    <span className="block text-[10px] text-neutral-500 font-normal">
                                      {d.companyName}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-[10px]">{d.phone || '—'}</td>
                                <td className="p-2 border-r border-neutral-300 dark:border-slate-700">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-mono text-[10px] font-semibold">
                                    {d.srGroup || 'General'}
                                  </span>
                                </td>
                                <td className="p-2 font-mono text-right font-bold text-rose-700 dark:text-rose-400">
                                  {formatMoney(d.dueAmount ?? d.currentDue ?? 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Suppliers */}
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-600 shadow-sm rounded-xs">
                      <div className="bg-blue-900 text-white p-2 font-bold uppercase tracking-wider text-xs border-b border-neutral-400 dark:border-slate-600 flex justify-between items-center">
                        <span>Accounts Payable (Supplier Dues)</span>
                        <span className="font-mono font-bold">
                          {formatMoney(data?.totalSupplierDue || 0)}
                        </span>
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
                            {(!data?.supplierDues || data.supplierDues.length === 0) ? (
                              <tr><td colSpan={3} className="p-4 text-center italic text-neutral-500">No dues.</td></tr>
                            ) : data.supplierDues.map((d: any, i: number) => (
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
                </div>
              )}

              {/* === WAREHOUSE STOCK SPREADSHEET VIEW === */}
              {activeReport === 'warehouse-stock' && (() => {
                const warehouseList = Array.isArray(data) ? data : [];
                const allStockEntries: any[] = [];
                warehouseList.forEach((wh: any) => {
                  (wh.stocks || []).forEach((s: any) => {
                    allStockEntries.push({
                      ...s,
                      warehouseName: wh.warehouseName,
                      warehouseLocation: wh.location || wh.address,
                    });
                  });
                });

                const totalCostValue = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.totalCostValue || 0), 0);
                const totalRetailValue = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.totalRetailValue || 0), 0);
                const totalQuantity = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.totalQuantity || 0), 0);
                const inStockCount = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.inStockItems || 0), 0);
                const lowStockCount = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.lowStockItems || 0), 0);
                const outOfStockCount = warehouseList.reduce((acc: number, wh: any) => acc + Number(wh.outOfStockItems || 0), 0);
                const potentialMargin = totalRetailValue - totalCostValue;
                const marginPercent = totalRetailValue > 0 ? ((potentialMargin / totalRetailValue) * 100).toFixed(1) : '0.0';

                const displayStocks = allStockEntries.filter((s: any) => {
                  if (warehouseStockStatus !== 'ALL' && s.stockStatus !== warehouseStockStatus) {
                    return false;
                  }
                  if (warehouseStockSearch.trim()) {
                    const q = warehouseStockSearch.toLowerCase();
                    const matchName = s.productName?.toLowerCase().includes(q);
                    const matchSku = s.sku?.toLowerCase().includes(q);
                    const matchBarcode = s.barcode?.toLowerCase().includes(q);
                    const matchCompany = s.company?.toLowerCase().includes(q);
                    const matchWh = s.warehouseName?.toLowerCase().includes(q);
                    if (!matchName && !matchSku && !matchBarcode && !matchCompany && !matchWh) {
                      return false;
                    }
                  }
                  return true;
                });

                const currentWhObj = availableWarehouses.find((w) => w.id === selectedWarehouseId);

                return (
                  <div className="space-y-3">
                    {/* Financial KPI Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* Card 1: Warehouse Scope & Stock Status */}
                      <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 p-3 shadow-xs rounded-xs border-l-4 border-l-[#006400] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                              <Warehouse className="w-3.5 h-3.5 text-[#006400] dark:text-emerald-400" />
                              Warehouse Scope
                            </span>
                            <span className="text-[10px] font-mono font-bold text-neutral-500">
                              {displayStocks.length} Lines Listed
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1 truncate" title={currentWhObj ? currentWhObj.name : 'All Warehouses Combined'}>
                            {currentWhObj ? currentWhObj.name : 'All Warehouses (Combined)'}
                          </h3>
                          {currentWhObj?.address && (
                            <p className="text-[10px] text-neutral-500 truncate">{currentWhObj.address}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-200 dark:border-slate-800 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            In Stock: {inStockCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            Low: {lowStockCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                            Out: {outOfStockCount}
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Total Units */}
                      <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 p-3 shadow-xs rounded-xs border-l-4 border-l-amber-500 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5 text-amber-600" />
                            Total Stock Units
                          </span>
                          <h4 className="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1 leading-none">
                            {totalQuantity.toLocaleString()} <span className="text-xs font-normal text-neutral-500 font-sans">Units</span>
                          </h4>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-2 pt-2 border-t border-neutral-200 dark:border-slate-800 flex justify-between">
                          <span>Tracked Products:</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200">{allStockEntries.length} Items</span>
                        </div>
                      </div>

                      {/* Card 3: Purchase Value (Cost) */}
                      <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 p-3 shadow-xs rounded-xs border-l-4 border-l-blue-600 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                            Total Purchase Valuation (Cost)
                          </span>
                          <h4 className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1 leading-none">
                            {formatMoney(totalCostValue)}
                          </h4>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-2 pt-2 border-t border-neutral-200 dark:border-slate-800">
                          Total stock purchase / investment cost
                        </div>
                      </div>

                      {/* Card 4: Retail Value & Potential Margin */}
                      <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 p-3 shadow-xs rounded-xs border-l-4 border-l-emerald-600 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            Total Retail Valuation (Sale)
                          </span>
                          <h4 className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 leading-none">
                            {formatMoney(totalRetailValue)}
                          </h4>
                        </div>
                        <div className="text-[10px] font-mono mt-2 pt-2 border-t border-neutral-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-neutral-500">Exp. Gross Margin:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatMoney(potentialMargin)} ({marginPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Classic ERP Spreadsheet Table */}
                    <div className="bg-white dark:bg-slate-950 border border-neutral-400 dark:border-slate-700 shadow-sm rounded-xs overflow-hidden flex flex-col">
                      <div className="bg-[#006400] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#004d00]">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                          <h2 className="text-xs font-bold uppercase tracking-wide">
                            {currentWhObj ? `${currentWhObj.name} Stock Spreadsheet` : 'All Warehouses Stock Spreadsheet'}
                          </h2>
                        </div>
                        <div className="text-[11px] font-mono opacity-90">
                          Displaying <strong>{displayStocks.length}</strong> of {allStockEntries.length} items
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                          <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-b border-neutral-300 dark:border-slate-700 font-bold select-none z-10">
                            <tr>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-10">SN</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 w-28">Item Code</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 w-32">Barcode</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 min-w-[220px]">Product Name & Company</th>
                              {selectedWarehouseId === 'ALL' && (
                                <th className="p-2 border-r border-neutral-300 dark:border-slate-700 w-32">Godown</th>
                              )}
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-20">Unit</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-28">Stock Qty</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Purchase Rate (৳)</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-32">Total Cost (৳)</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Sale Rate (৳)</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-32">Total Retail (৳)</th>
                              <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Status</th>
                              <th className="p-2 text-center w-32">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                            {displayStocks.length === 0 ? (
                              <tr>
                                <td colSpan={selectedWarehouseId === 'ALL' ? 13 : 12} className="p-8 text-center text-neutral-500 font-medium">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <Package className="w-8 h-8 text-neutral-400" />
                                    <span>No stock records found matching your filters.</span>
                                    {(warehouseStockSearch || warehouseStockStatus !== 'ALL') && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setWarehouseStockSearch('');
                                          setWarehouseStockStatus('ALL');
                                        }}
                                        className="mt-1 text-xs text-[#006400] font-bold underline cursor-pointer"
                                      >
                                        Clear all filters
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              displayStocks.map((s: any, idx: number) => {
                                const isSelected = selectedStockRowId === s.id;
                                const fullProduct: Product = s.product || {
                                  id: s.productId,
                                  name: s.productName,
                                  sku: s.sku,
                                  barcode: s.barcode,
                                  unit: s.unit,
                                  packSize: s.packSize,
                                  costPrice: s.costPrice,
                                  sellingPrice: s.sellingPrice,
                                  reorderLevel: s.reorderLevel,
                                  quantity: s.quantity,
                                  stockStatus: s.stockStatus,
                                  isActive: s.isActive,
                                  description: s.description,
                                };

                                return (
                                  <tr
                                    key={s.id || idx}
                                    onClick={() => setSelectedStockRowId(s.id)}
                                    onDoubleClick={() => setDetailProduct(fullProduct)}
                                    title="Double click to view product specifications"
                                    className={`transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#0056b3] text-white font-semibold'
                                        : idx % 2 === 0
                                        ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                                        : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                                    }`}
                                  >
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-center font-mono ${
                                      isSelected ? 'text-blue-200' : 'text-neutral-500'
                                    }`}>
                                      {idx + 1}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 font-mono font-bold ${
                                      isSelected ? 'text-white' : 'text-neutral-800 dark:text-neutral-100'
                                    }`}>
                                      {s.sku}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 font-mono text-[11px] ${
                                      isSelected ? 'text-emerald-200' : 'text-emerald-700 dark:text-emerald-400 font-bold'
                                    }`}>
                                      {s.barcode || '—'}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 font-semibold ${
                                      isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'
                                    }`}>
                                      <div>{s.productName}</div>
                                      <div className={`text-[10px] font-normal flex items-center gap-1.5 mt-0.5 ${
                                        isSelected ? 'text-blue-100' : 'text-neutral-500'
                                      }`}>
                                        {s.company && s.company !== 'N/A' && (
                                          <span className="font-medium">{s.company}</span>
                                        )}
                                        {s.category && s.category !== 'N/A' && (
                                          <>
                                            <span>•</span>
                                            <span>{s.category}</span>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    {selectedWarehouseId === 'ALL' && (
                                      <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 font-medium ${
                                        isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'
                                      }`}>
                                        {s.warehouseName}
                                      </td>
                                    )}
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-center ${
                                      isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                      {formatUnitLabel(s.unit)}
                                      {s.packSize && s.packSize > 1 ? ` (${s.packSize})` : ''}
                                    </td>
                                    <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center font-mono font-bold">
                                      <span className={`text-sm ${
                                        s.quantity <= 0
                                          ? isSelected ? 'text-rose-200' : 'text-rose-600'
                                          : s.quantity <= s.reorderLevel
                                          ? isSelected ? 'text-amber-200' : 'text-amber-600'
                                          : isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'
                                      }`}>
                                        {formatStock(s.quantity, s.unit, s.packSize)}
                                      </span>
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-right font-mono ${
                                      isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                      ৳{Number(s.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-right font-mono font-bold ${
                                      isSelected ? 'text-white' : 'text-blue-700 dark:text-blue-400'
                                    }`}>
                                      ৳{Number(s.totalCostValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-right font-mono font-bold ${
                                      isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'
                                    }`}>
                                      ৳{Number(s.sellingPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`p-2 border-r border-neutral-300 dark:border-slate-700 text-right font-mono font-bold ${
                                      isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                                    }`}>
                                      ৳{Number(s.totalRetailValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                                      <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                                        s.stockStatus === 'IN_STOCK'
                                          ? isSelected
                                            ? 'bg-emerald-600 text-white border-emerald-500'
                                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                          : s.stockStatus === 'LOW_STOCK'
                                          ? isSelected
                                            ? 'bg-amber-600 text-white border-amber-500'
                                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                                          : isSelected
                                          ? 'bg-rose-600 text-white border-rose-500'
                                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                                      }`}>
                                        {s.stockStatus === 'IN_STOCK' ? 'IN STOCK' : s.stockStatus === 'LOW_STOCK' ? 'LOW STOCK' : 'OUT OF STOCK'}
                                      </span>
                                    </td>
                                    <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setDetailProduct(fullProduct)}
                                          className="h-6 px-1.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-500 hover:bg-blue-50 rounded-xs font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          title="View Product Specifications"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span className="hidden sm:inline">Details</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditProduct(fullProduct)}
                                          className="h-6 px-1.5 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          title="Edit Product"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span className="hidden sm:inline">Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setBarcodeProduct(fullProduct)}
                                          className="h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 hover:bg-neutral-100 rounded-xs font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                          title="Print Barcode Labels"
                                        >
                                          <BarcodeIcon className="w-3 h-3 text-emerald-700" />
                                          <span className="hidden sm:inline">Barcode</span>
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
                  </div>
                );
              })()}

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
      {/* Customer Ledger Modal */}
      <CustomerLedgerModal
        open={isCustomerLedgerOpen}
        onOpenChange={setIsCustomerLedgerOpen}
      />

      {/* Advanced Stock & Performance Modal */}
      <StockAgingReorderModal
        open={isStockAgingModalOpen}
        onOpenChange={setIsStockAgingModalOpen}
        initialTab={stockAgingTab}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={!!detailProduct}
        onOpenChange={(open) => !open && setDetailProduct(null)}
        product={detailProduct}
        onEdit={(p) => setEditProduct(p)}
        onPrintBarcode={(p) => setBarcodeProduct(p)}
      />

      {/* Product Edit Modal */}
      <ProductEditModal
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
        product={editProduct}
        onSuccess={() => {
          fetchReport();
        }}
      />

      {/* Barcode Print Modal */}
      <BarcodePrintModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-48 gap-2 text-neutral-500 font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[#006400]" />
          <span>Loading Reports...</span>
        </div>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
