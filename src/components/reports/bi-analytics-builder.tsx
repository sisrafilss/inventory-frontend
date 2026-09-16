'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart2,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  Download,
  GripVertical,
  Plus,
  X,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Building2,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ColumnDef {
  id: string;
  label: string;
  key: string;
  align?: 'left' | 'center' | 'right';
  format?: (val: any, row: any) => React.ReactNode;
}

const ALL_AVAILABLE_COLUMNS: ColumnDef[] = [
  { id: 'sn', label: 'SN', key: 'sn', align: 'center' },
  { id: 'date', label: 'Date', key: 'date', align: 'center' },
  { id: 'invoiceNumber', label: 'Invoice #', key: 'invoiceNumber', align: 'left' },
  { id: 'customerName', label: 'Customer', key: 'customerName', align: 'left' },
  { id: 'warehouseName', label: 'Godown / Warehouse', key: 'warehouseName', align: 'left' },
  { id: 'productName', label: 'Item Name', key: 'productName', align: 'left' },
  { id: 'sku', label: 'Product SKU', key: 'sku', align: 'left' },
  { id: 'barcode', label: 'Barcode', key: 'barcode', align: 'center' },
  { id: 'categoryName', label: 'Category', key: 'categoryName', align: 'left' },
  { id: 'companyName', label: 'Company', key: 'companyName', align: 'left' },
  { id: 'quantity', label: 'Qty Sold', key: 'quantity', align: 'center' },
  { id: 'unitPrice', label: 'Unit Price', key: 'unitPrice', align: 'right', format: (v) => formatMoney(v) },
  { id: 'purchaseCost', label: 'Cost Price', key: 'purchaseCost', align: 'right', format: (v) => formatMoney(v) },
  { id: 'lineTotal', label: 'Total Revenue', key: 'lineTotal', align: 'right', format: (v) => formatMoney(v) },
  { id: 'totalCost', label: 'Total Cost', key: 'totalCost', align: 'right', format: (v) => formatMoney(v) },
  {
    id: 'profit',
    label: 'Net Profit',
    key: 'profit',
    align: 'right',
    format: (v) => (
      <span className={`font-bold ${v >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
        {formatMoney(v)}
      </span>
    ),
  },
  {
    id: 'marginPercent',
    label: 'Margin %',
    key: 'marginPercent',
    align: 'right',
    format: (v) => (
      <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] ${
        v >= 20 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
        v >= 10 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
      }`}>
        {v}%
      </span>
    ),
  },
];

const DEFAULT_ACTIVE_COLUMN_IDS = [
  'sn',
  'date',
  'invoiceNumber',
  'productName',
  'categoryName',
  'quantity',
  'lineTotal',
  'totalCost',
  'profit',
  'marginPercent',
];

export function BIAnalyticsBuilder() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [momData, setMomData] = useState<any>(null);

  // Filter States
  const [datePreset, setDatePreset] = useState<'7d' | '30d' | 'mtd' | 'ytd' | 'custom'>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Dropdowns metadata
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Drag and Drop active columns
  const [activeColumnIds, setActiveColumnIds] = useState<string[]>(DEFAULT_ACTIVE_COLUMN_IDS);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);

  // Search filter inside custom table
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    applyDatePreset(datePreset);
  }, [datePreset]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, selectedWarehouseId, selectedCategoryId]);

  const fetchMetadata = async () => {
    try {
      const [whRes, catRes] = await Promise.all([
        api.get<any>('/warehouses'),
        api.get<any>('/categories'),
      ]);
      setWarehouses(whRes.data || []);
      setCategories(catRes.data || []);
    } catch {
      // Non-blocking
    }
  };

  const applyDatePreset = (preset: '7d' | '30d' | 'mtd' | 'ytd' | 'custom') => {
    if (preset === 'custom') return;

    const now = new Date();
    const endStr = now.toISOString().split('T')[0];
    let startStr = '';

    if (preset === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startStr = past7.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startStr = past30.toISOString().split('T')[0];
    } else if (preset === 'mtd') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startStr = firstDay.toISOString().split('T')[0];
    } else if (preset === 'ytd') {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      startStr = firstDayYear.toISOString().split('T')[0];
    }

    setStartDate(startStr);
    setEndDate(endStr);
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params: any = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        warehouseId: selectedWarehouseId || undefined,
        categoryId: selectedCategoryId || undefined,
      };
      const [res, momRes] = await Promise.all([
        api.get<any>('/reports/bi-analytics', params),
        api.get<any>('/reports/mom-comparison'),
      ]);
      setData(res.data);
      setMomData(momRes.data);
    } catch (err: any) {
      toast.error('Failed to load BI Analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedColId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnActive = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedColId || e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    // Check if source is already in active
    const sourceIndex = activeColumnIds.indexOf(sourceId);
    const targetIndex = activeColumnIds.indexOf(targetId);

    if (sourceIndex >= 0 && targetIndex >= 0) {
      // Reorder
      const updated = [...activeColumnIds];
      updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, sourceId);
      setActiveColumnIds(updated);
    } else if (sourceIndex === -1 && targetIndex >= 0) {
      // Insert new column from available pool
      const updated = [...activeColumnIds];
      updated.splice(targetIndex, 0, sourceId);
      setActiveColumnIds(updated);
    }
    setDraggedColId(null);
  };

  const addColumnToActive = (colId: string) => {
    if (!activeColumnIds.includes(colId)) {
      setActiveColumnIds([...activeColumnIds, colId]);
    }
  };

  const removeColumnFromActive = (colId: string) => {
    if (activeColumnIds.length <= 1) {
      toast.warning('Custom report requires at least one column.');
      return;
    }
    setActiveColumnIds(activeColumnIds.filter((id) => id !== colId));
  };

  // Filtered Line Items for table
  const lineItems: any[] = data?.lineItems || [];
  const filteredLineItems = lineItems.filter((item) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q)) ||
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    );
  });

  const activeColumns = activeColumnIds
    .map((id) => ALL_AVAILABLE_COLUMNS.find((col) => col.id === id))
    .filter(Boolean) as ColumnDef[];

  const summary = data?.summary || {
    totalSalesCount: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    overallMarginPercent: 0,
    totalDiscount: 0,
  };

  const dailyTrends: any[] = data?.dailyTrends || [];
  const categoryBreakdown: any[] = data?.categoryBreakdown || [];
  const topProfitProducts: any[] = data?.topProfitProducts || [];

  // SVG Chart Scaling Helpers
  const maxTrendVal = Math.max(...dailyTrends.map((d) => Math.max(d.revenue, d.cost)), 100);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredLineItems.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = activeColumns.map((col) => `"${col.label}"`).join(',');
    const rows = filteredLineItems.map((item) =>
      activeColumns
        .map((col) => {
          const val = item[col.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BI_Custom_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully!');
  };

  return (
    <div className="space-y-4 p-3 sm:p-4 text-neutral-900 dark:text-neutral-100 select-none">
      
      {/* 1. Header & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                Custom Report Builder & BI Analytics
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800">
                  PRO MARGIN ANALYTICS
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Drag and drop metric columns to design custom reports and visually analyze profit margins
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintReport}
              className="h-8 px-3 bg-white dark:bg-slate-900 hover:bg-neutral-100 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-600 rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-slate-700/70">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-slate-900 p-1 rounded border border-neutral-300 dark:border-slate-700 text-xs">
            <span className="font-bold px-2 text-neutral-600 dark:text-neutral-400">Range:</span>
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'mtd', label: 'This Month' },
              { id: 'ytd', label: 'Year To Date' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDatePreset(p.id as any)}
                className={`px-2.5 py-1 font-semibold rounded text-xs transition-colors ${
                  datePreset === p.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'hover:bg-neutral-200 dark:hover:bg-slate-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-neutral-300 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              />
            </div>

            {/* Warehouse Filter */}
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="h-8 px-2 bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Godowns / Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-8 px-2 bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="h-8 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold text-xs rounded flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive BI KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded border border-neutral-300 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Gross Revenue</div>
            <div className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {formatMoney(summary.totalRevenue)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              From {summary.totalSalesCount} completed sales
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded border border-neutral-300 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Cost of Goods (COGS)</div>
            <div className="text-lg font-mono font-bold text-neutral-800 dark:text-neutral-200 mt-1">
              {formatMoney(summary.totalCost)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Direct inventory purchase cost
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded border border-neutral-300 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Net Profit</div>
            <div className={`text-lg font-mono font-bold mt-1 ${
              summary.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
            }`}>
              {formatMoney(summary.netProfit)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              After item costs & discounts
            </div>
          </div>
          <div className={`w-10 h-10 rounded border flex items-center justify-center ${
            summary.netProfit >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900 text-rose-600'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Profit Margin % */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded border border-neutral-300 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Profit Margin %</div>
            <div className="text-xl font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1">
              {summary.overallMarginPercent}%
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {summary.totalUnitsSold.toLocaleString()} total units sold
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MoM Comparison Box */}
      {momData && (
        <div className="bg-[#eaf1f8] dark:bg-slate-800/90 p-3.5 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-2.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-300 dark:border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-wide text-neutral-800 dark:text-neutral-100">
                Month-over-Month Performance Comparison (বিগত মাস বনাম বর্তমান মাস)
              </h3>
            </div>
            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
              Comparing <strong>{momData.previousMonthName}</strong> ➔ <strong>{momData.currentMonthName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Revenue Comparison */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-neutral-300 dark:border-slate-700 shadow-xs">
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Sales Revenue</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {formatMoney(momData.currentMonth.revenue)}
                </span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  momData.growth.revenueGrowth >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {momData.growth.revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {momData.growth.revenueGrowth >= 0 ? `+${momData.growth.revenueGrowth}%` : `${momData.growth.revenueGrowth}%`}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Prev Month: {formatMoney(momData.previousMonth.revenue)}
              </div>
            </div>

            {/* Net Profit Comparison */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-neutral-300 dark:border-slate-700 shadow-xs">
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Net Profit</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                  {formatMoney(momData.currentMonth.profit)}
                </span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  momData.growth.profitGrowth >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {momData.growth.profitGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {momData.growth.profitGrowth >= 0 ? `+${momData.growth.profitGrowth}%` : `${momData.growth.profitGrowth}%`}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Prev Month: {formatMoney(momData.previousMonth.profit)}
              </div>
            </div>

            {/* Invoices Count Comparison */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-neutral-300 dark:border-slate-700 shadow-xs">
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Total Sales Orders</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {momData.currentMonth.salesCount} Invoices
                </span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  momData.growth.salesCountGrowth >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {momData.growth.salesCountGrowth >= 0 ? `+${momData.growth.salesCountGrowth}%` : `${momData.growth.salesCountGrowth}%`}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Prev Month: {momData.previousMonth.salesCount} Invoices
              </div>
            </div>

            {/* Units Sold Comparison */}
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-neutral-300 dark:border-slate-700 shadow-xs">
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Units Volume Sold</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {momData.currentMonth.unitsSold.toLocaleString()} Pcs
                </span>
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  momData.growth.unitsSoldGrowth >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {momData.growth.unitsSoldGrowth >= 0 ? `+${momData.growth.unitsSoldGrowth}%` : `${momData.growth.unitsSoldGrowth}%`}
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Prev Month: {momData.previousMonth.unitsSold.toLocaleString()} Pcs
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BI Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Revenue vs COGS & Profit Margin Trend (Span 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Daily Revenue vs Cost & Profit Margin Trend
            </h3>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Revenue
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Cost
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Net Profit
              </span>
            </div>
          </div>

          {dailyTrends.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-neutral-400 text-xs">
              <BarChart2 className="w-8 h-8 mb-1 opacity-40" />
              <span>No sales data recorded for selected period.</span>
            </div>
          ) : (
            <div className="relative h-56 w-full flex items-end justify-between gap-1 pt-6 pb-6 px-2 border-b border-neutral-200 dark:border-slate-700">
              {dailyTrends.map((d, idx) => {
                const revHeight = maxTrendVal > 0 ? (d.revenue / maxTrendVal) * 160 : 0;
                const costHeight = maxTrendVal > 0 ? (d.cost / maxTrendVal) * 160 : 0;
                const profitHeight = maxTrendVal > 0 ? (Math.max(0, d.profit) / maxTrendVal) * 160 : 0;

                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-nowrap border border-slate-700">
                      <span className="font-bold text-amber-300">{d.date}</span>
                      <span>Revenue: {formatMoney(d.revenue)}</span>
                      <span>Cost: {formatMoney(d.cost)}</span>
                      <span className="text-emerald-400 font-bold">Profit: {formatMoney(d.profit)} ({d.marginPercent}%)</span>
                    </div>

                    {/* Bars Stack */}
                    <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 h-full">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${Math.max(4, revHeight)}px` }}
                        className="w-2.5 bg-emerald-600 rounded-t transition-all group-hover:bg-emerald-500"
                      />
                      {/* Cost Bar */}
                      <div
                        style={{ height: `${Math.max(4, costHeight)}px` }}
                        className="w-2.5 bg-amber-500 rounded-t transition-all group-hover:bg-amber-400"
                      />
                      {/* Profit Bar */}
                      <div
                        style={{ height: `${Math.max(4, profitHeight)}px` }}
                        className="w-2.5 bg-blue-600 rounded-t transition-all group-hover:bg-blue-500"
                      />
                    </div>

                    <span className="text-[9px] font-mono text-neutral-500 truncate w-full text-center mt-1">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Category Profit Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-3">
          <div className="border-b pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Profit Margin by Category
            </h3>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-neutral-400 text-xs">
              <PieChart className="w-8 h-8 mb-1 opacity-40" />
              <span>No categories data.</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categoryBreakdown.map((cat) => (
                <div key={cat.categoryName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-800 dark:text-neutral-200 truncate pr-2">
                      {cat.categoryName}
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                      {formatMoney(cat.profit)} ({cat.marginPercent}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-neutral-100 dark:bg-slate-900 rounded overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, Math.max(5, cat.marginPercent))}%` }}
                      className={`h-full rounded transition-all ${
                        cat.marginPercent >= 20 ? 'bg-emerald-600' : cat.marginPercent >= 10 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Top 10 Profit Products Ranking */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Top Profit-Generating Products Ranking
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">Ranked by total net profit</span>
        </div>

        {topProfitProducts.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 text-xs">
            No product sales in range.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {topProfitProducts.map((p, rank) => (
              <div
                key={p.id}
                className="bg-[#f4f8fc] dark:bg-slate-900/60 p-2.5 rounded border border-neutral-300 dark:border-slate-700/80 flex flex-col justify-between space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                    #{rank + 1}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                    {p.marginPercent}% Margin
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 truncate">
                    SKU: {p.sku} {p.barcode ? `| BC: ${p.barcode}` : ''}
                  </div>
                </div>
                <div className="pt-1 border-t border-neutral-200 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-semibold">{p.unitsSold} Sold</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {formatMoney(p.profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Drag-and-Drop Custom Report Builder Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded border border-neutral-300 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Drag & Drop Report Column Builder
            </h3>
            <p className="text-[11px] text-neutral-500">
              Drag available metrics to add or reorder table columns in real-time
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveColumnIds(DEFAULT_ACTIVE_COLUMN_IDS)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Reset Default Layout
          </button>
        </div>

        {/* Drag & Drop Column Controller Area */}
        <div className="space-y-3 bg-[#eaf1f8] dark:bg-slate-900/80 p-3 rounded border border-neutral-300 dark:border-slate-700">
          {/* Active Columns Zone (Drop Target) */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <span>Active Table Columns (Drag to re-order):</span>
              <span className="text-[10px] text-neutral-500 font-normal">[{activeColumnIds.length} columns selected]</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[42px] p-2 bg-white dark:bg-slate-950 border-2 border-dashed border-emerald-500/50 rounded">
              {activeColumns.map((col) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnActive(e, col.id)}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded text-xs font-bold flex items-center gap-1.5 cursor-grab active:cursor-grabbing shadow-xs transition-all hover:scale-105"
                >
                  <GripVertical className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{col.label}</span>
                  <button
                    type="button"
                    onClick={() => removeColumnFromActive(col.id)}
                    className="text-emerald-700 hover:text-rose-600 p-0.5 rounded transition-colors"
                    title="Remove column"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Available Column Pool */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Available Metrics Pool (Click + to add):
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {ALL_AVAILABLE_COLUMNS.filter((col) => !activeColumnIds.includes(col.id)).map((col) => (
                <button
                  key={col.id}
                  type="button"
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onClick={() => addColumnToActive(col.id)}
                  className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-neutral-300 dark:border-slate-600 rounded text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Click or drag to add"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{col.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar inside table */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Filter custom table by item name, SKU, customer, or invoice..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <Filter className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="text-xs font-mono text-neutral-500">
            Showing <strong>{filteredLineItems.length}</strong> transaction entries
          </div>
        </div>

        {/* Dynamic Spreadsheet Custom Data Table */}
        <div className="border border-neutral-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200 z-10">
                <tr>
                  {activeColumns.map((col) => (
                    <th
                      key={col.id}
                      className={`py-2 px-3 border-r border-neutral-300 dark:border-slate-700 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-12 text-center text-neutral-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Generating custom report analytics...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLineItems.length === 0 ? (
                  <tr>
                    <td colSpan={activeColumns.length} className="py-12 text-center text-neutral-400">
                      No custom report transactions found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLineItems.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-neutral-50 dark:hover:bg-slate-900/80 transition-colors"
                    >
                      {activeColumns.map((col) => {
                        const rawVal = item[col.key];
                        return (
                          <td
                            key={col.id}
                            className={`py-2 px-3 border-r border-neutral-200 dark:border-slate-800 ${
                              col.align === 'center'
                                ? 'text-center font-mono'
                                : col.align === 'right'
                                ? 'text-right font-mono'
                                : 'text-left'
                            }`}
                          >
                            {col.format ? col.format(rawVal, item) : (rawVal ?? '—')}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              {/* Summary Footer */}
              {!loading && filteredLineItems.length > 0 && (
                <tfoot className="sticky bottom-0 bg-neutral-100 dark:bg-slate-900 font-bold border-t-2 border-neutral-400 dark:border-slate-700 text-xs">
                  <tr>
                    {activeColumns.map((col, idx) => {
                      if (idx === 0) {
                        return (
                          <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 uppercase">
                            Total Summary
                          </td>
                        );
                      }
                      if (col.key === 'quantity') {
                        const totalQty = filteredLineItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
                        return (
                          <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center font-mono">
                            {totalQty.toLocaleString()}
                          </td>
                        );
                      }
                      if (col.key === 'lineTotal') {
                        const totalRev = filteredLineItems.reduce((acc, i) => acc + (i.lineTotal || 0), 0);
                        return (
                          <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right font-mono">
                            {formatMoney(totalRev)}
                          </td>
                        );
                      }
                      if (col.key === 'totalCost') {
                        const totalC = filteredLineItems.reduce((acc, i) => acc + (i.totalCost || 0), 0);
                        return (
                          <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right font-mono">
                            {formatMoney(totalC)}
                          </td>
                        );
                      }
                      if (col.key === 'profit') {
                        const totalP = filteredLineItems.reduce((acc, i) => acc + (i.profit || 0), 0);
                        return (
                          <td key={col.id} className={`py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right font-mono ${
                            totalP >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
                          }`}>
                            {formatMoney(totalP)}
                          </td>
                        );
                      }
                      if (col.key === 'marginPercent') {
                        const revSum = filteredLineItems.reduce((acc, i) => acc + (i.lineTotal || 0), 0);
                        const profSum = filteredLineItems.reduce((acc, i) => acc + (i.profit || 0), 0);
                        const avgMargin = revSum > 0 ? ((profSum / revSum) * 100).toFixed(1) : '0';
                        return (
                          <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right font-mono text-emerald-700 dark:text-emerald-400">
                            {avgMargin}%
                          </td>
                        );
                      }
                      return (
                        <td key={col.id} className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-neutral-400">
                          —
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
