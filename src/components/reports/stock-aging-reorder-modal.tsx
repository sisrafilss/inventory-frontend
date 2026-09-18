'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/utils';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Clock,
  Zap,
  Users,
  Printer,
  Download,
  Loader2,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  Check,
  RefreshCw,
  Filter,
  Calendar,
  Search,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export interface StockAgingReportViewProps {
  initialTab?: 'reorder' | 'aging' | 'velocity' | 'user';
  onOpenPurchaseWithProduct?: (sku: string) => void;
  embedded?: boolean;
  onClose?: () => void;
}

export function StockAgingReportView({
  initialTab = 'reorder',
  onOpenPurchaseWithProduct,
  embedded = false,
  onClose,
}: StockAgingReportViewProps) {
  const [activeTab, setActiveTab] = useState<'reorder' | 'aging' | 'velocity' | 'user'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Stock Aging interactive filters
  const [agingBracket, setAgingBracket] = useState<'ALL' | '0-30' | '31-60' | '61-90' | '90+'>('ALL');
  const [agingFromDate, setAgingFromDate] = useState<string>('');
  const [agingToDate, setAgingToDate] = useState<string>('');
  const [agingMinDays, setAgingMinDays] = useState<string>('');
  const [agingMaxDays, setAgingMaxDays] = useState<string>('');
  const [agingSearch, setAgingSearch] = useState<string>('');

  const handleResetAgingFilters = () => {
    setAgingBracket('ALL');
    setAgingFromDate('');
    setAgingToDate('');
    setAgingMinDays('');
    setAgingMaxDays('');
    setAgingSearch('');
  };

  const handleCardBracketClick = (bracket: '0-30' | '31-60' | '61-90' | '90+') => {
    if (agingBracket === bracket) {
      setAgingBracket('ALL');
    } else {
      setAgingBracket(bracket);
    }
  };

  const filteredAgingItems = React.useMemo(() => {
    if (!data?.items || activeTab !== 'aging') return [];
    return data.items.filter((item: any) => {
      // Bracket filter
      if (agingBracket === '0-30' && item.ageBracket !== '0-30 Days') return false;
      if (agingBracket === '31-60' && item.ageBracket !== '31-60 Days') return false;
      if (agingBracket === '61-90' && item.ageBracket !== '61-90 Days') return false;
      if (agingBracket === '90+' && item.ageBracket !== '90+ Days (Dead Stock)') return false;

      // Custom days filter
      if (agingMinDays !== '' && !isNaN(Number(agingMinDays))) {
        if ((item.ageDays ?? 0) < Number(agingMinDays)) return false;
      }
      if (agingMaxDays !== '' && !isNaN(Number(agingMaxDays))) {
        if ((item.ageDays ?? 0) > Number(agingMaxDays)) return false;
      }

      // Custom date filter (Last Sale Date)
      if (agingFromDate && item.lastSaleDate) {
        if (item.lastSaleDate < agingFromDate) return false;
      }
      if (agingToDate && item.lastSaleDate) {
        if (item.lastSaleDate > agingToDate) return false;
      }

      // Search filter
      if (agingSearch.trim()) {
        const q = agingSearch.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchSku = item.sku?.toLowerCase().includes(q);
        const matchBarcode = item.barcode?.toLowerCase().includes(q);
        const matchCompany = item.company?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode && !matchCompany && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [data?.items, activeTab, agingBracket, agingMinDays, agingMaxDays, agingFromDate, agingToDate, agingSearch]);

  const isAgingFilterActive =
    agingBracket !== 'ALL' ||
    agingFromDate !== '' ||
    agingToDate !== '' ||
    agingMinDays !== '' ||
    agingMaxDays !== '' ||
    agingSearch.trim() !== '';

  const handleTabChange = (tab: 'reorder' | 'aging' | 'velocity' | 'user') => {
    if (activeTab === tab) return;
    setData(null);
    setLoading(true);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    setData(null);
    try {
      let endpoint = '/reports/reorder-alerts';
      if (activeTab === 'aging') endpoint = '/reports/stock-aging';
      if (activeTab === 'velocity') endpoint = '/reports/product-velocity';
      if (activeTab === 'user') endpoint = '/reports/user-performance';

      const res = await api.get<any>(endpoint);
      setData(res.data);
    } catch (err: any) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data || !data.items && !data.users) {
      toast.warning('No data to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'reorder') {
      const headers = ['SKU', 'Barcode', 'Product Name', 'Category', 'Current Stock', 'Reorder Level', 'Suggested Reorder Qty', 'Estimated Cost'];
      const rows = (data.items || []).map((i: any) => [
        `"${i.sku}"`, `"${i.barcode}"`, `"${i.name.replace(/"/g, '""')}"`, `"${i.category}"`, `"${i.currentStock}"`, `"${i.reorderLevel}"`, `"${i.suggestedReorderQty}"`, `"${i.totalEstimatedCost}"`
      ]);
      csvContent += [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    } else if (activeTab === 'aging') {
      const itemsToExport = filteredAgingItems.length > 0 ? filteredAgingItems : (data.items || []);
      const headers = ['SKU', 'Barcode', 'Product Name', 'Category', 'Current Stock', 'Last Sale Date', 'Age (Days)', 'Age Bracket', 'Stock Valuation'];
      const rows = itemsToExport.map((i: any) => [
        `"${i.sku}"`, `"${i.barcode}"`, `"${i.name.replace(/"/g, '""')}"`, `"${i.category}"`, `"${i.currentStock}"`, `"${i.lastSaleDate}"`, `"${i.ageDays}"`, `"${i.ageBracket}"`, `"${i.totalValuation}"`
      ]);
      csvContent += [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    } else if (activeTab === 'velocity') {
      const headers = ['SKU', 'Barcode', 'Product Name', 'Category', 'Current Stock', '60-Days Sold Qty', '60-Days Revenue', 'Movement Speed'];
      const rows = (data.items || []).map((i: any) => [
        `"${i.sku}"`, `"${i.barcode}"`, `"${i.name.replace(/"/g, '""')}"`, `"${i.category}"`, `"${i.currentStock}"`, `"${i.unitsSold60Days}"`, `"${i.revenue60Days}"`, `"${i.velocityCategory}"`
      ]);
      csvContent += [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    } else if (activeTab === 'user') {
      const headers = ['Salesperson Name', 'Role', 'Invoices Count', 'Total Sales Revenue', 'Total Payments Collected', 'Current Dues', 'Avg Order Value'];
      const rows = (data.users || []).map((u: any) => [
        `"${u.userName.replace(/"/g, '""')}"`, `"${u.userRole}"`, `"${u.salesCount}"`, `"${u.totalRevenue}"`, `"${u.totalCollected}"`, `"${u.totalDue}"`, `"${u.avgOrderValue}"`
      ]);
      csvContent += [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV!');
  };

  return (
    <div className={embedded ? "w-full bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 shadow-sm rounded-xs overflow-hidden text-xs text-neutral-900 dark:text-neutral-100 select-none" : "w-full text-xs text-neutral-900 dark:text-neutral-100 select-none"}>
      
      {/* Banner Header */}
      <div className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-200" />
          <h2 className="text-sm sm:text-base font-bold tracking-wide">
            {activeTab === 'user'
              ? 'Salesperson Commercial Performance (বিক্রয় প্রতিনিধি কার্যক্ষমতা)'
              : 'Stock Alerts, Reorder & Aging Analytics (মজুদ সতর্কতা ও মেয়াদ বিশ্লেষণ)'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTabData}
            disabled={loading}
            className="h-6 px-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer text-xs disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {!embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center shadow transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

        {/* Tab Selection Bar & Export Buttons */}
        <div className="p-2.5 bg-[#eaf1f8] dark:bg-slate-800/80 border-b border-neutral-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'reorder', label: 'Low Stock Alerts', icon: AlertTriangle },
              { id: 'aging', label: 'Stock Aging (অবিক্রিত স্টক)', icon: Clock },
              { id: 'velocity', label: 'Fast & Slow Moving', icon: Zap },
              { id: 'user', label: 'Salesperson Performance', icon: Users },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-xs text-xs flex items-center gap-1.5 transition-colors uppercase tracking-wider cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0056b3] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-300 dark:border-slate-700'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
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

        {/* Main Content Container */}
        <div className={`p-4 space-y-4 ${embedded ? '' : 'max-h-[70vh] overflow-y-auto'}`}>
          
          {/* TAB 1: LOW STOCK & REORDER ALERTS */}
          {activeTab === 'reorder' && (
            <div className="space-y-3">
              {data?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#f4f8fc] dark:bg-slate-800/60 p-3 rounded border border-neutral-300 dark:border-slate-700 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Total Low Stock Alerts</div>
                    <div className="font-bold text-lg text-amber-600 dark:text-amber-400 mt-0.5">
                      {data.summary.totalAlerts} Items
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Out of Stock Items</div>
                    <div className="font-bold text-lg text-rose-600 dark:text-rose-400 mt-0.5">
                      {data.summary.outOfStockCount} Items
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Reorder Level Warning</div>
                    <div className="font-bold text-lg text-amber-600 mt-0.5">
                      {data.summary.lowStockCount} Items
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Estimated Replenishment Capital</div>
                    <div className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {formatMoney(data.summary.totalEstimatedCapitalNeeded)}
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                    <tr>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">Product Code</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">Barcode</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700">Product Name</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Current Stock</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Reorder Level</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-28">Suggested Order</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Est. Cost</th>
                      <th className="py-2 px-3 text-center w-28">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                    {loading || !data?.items ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Checking stock reorder levels...
                        </td>
                      </tr>
                    ) : data.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-emerald-700 font-bold">
                          ✓ All inventory items are sufficiently stocked above reorder levels.
                        </td>
                      </tr>
                    ) : (
                      data.items.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-neutral-50 dark:hover:bg-slate-900/60 transition-colors">
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-500">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                            {item.sku}
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                            {item.barcode}
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-bold">
                            {item.name}
                            <span className="text-[10px] font-normal text-neutral-500 block">{item.company} • {item.category}</span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center">
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                              item.currentStock <= 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-600">
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold text-emerald-700">
                            +{item.suggestedReorderQty} {item.unit}
                          </td>
                          <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold">
                            {formatMoney(item.totalEstimatedCost)}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            {onOpenPurchaseWithProduct ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose?.();
                                  onOpenPurchaseWithProduct(item.sku);
                                }}
                                className="px-2 py-1 bg-[#800000] hover:bg-rose-900 text-white font-bold text-[11px] rounded flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                Purchase
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-bold uppercase">Reorder Needed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK AGING REPORT */}
          {activeTab === 'aging' && (
            <div className="space-y-3">
              {data?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {/* Card 1: 0 - 30 Days */}
                  <button
                    type="button"
                    onClick={() => handleCardBracketClick('0-30')}
                    className={`p-3 rounded border text-left transition-all relative overflow-hidden cursor-pointer ${
                      agingBracket === '0-30'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/50 shadow-sm'
                        : 'bg-[#f4f8fc] dark:bg-slate-800/60 border-neutral-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        0 - 30 Days Stock
                      </div>
                      {agingBracket === '0-30' && (
                        <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg text-emerald-700 dark:text-emerald-400 mt-1 flex items-baseline justify-between">
                      <span>{data.summary.bracket0_30} Items</span>
                      <span className="text-[10px] font-normal text-neutral-500">Fast Turnover</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Click to {agingBracket === '0-30' ? 'remove filter' : 'filter table'}</div>
                  </button>

                  {/* Card 2: 31 - 60 Days */}
                  <button
                    type="button"
                    onClick={() => handleCardBracketClick('31-60')}
                    className={`p-3 rounded border text-left transition-all relative overflow-hidden cursor-pointer ${
                      agingBracket === '31-60'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/50 shadow-sm'
                        : 'bg-[#f4f8fc] dark:bg-slate-800/60 border-neutral-300 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                        31 - 60 Days Stock
                      </div>
                      {agingBracket === '31-60' && (
                        <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg text-blue-700 dark:text-blue-400 mt-1 flex items-baseline justify-between">
                      <span>{data.summary.bracket31_60} Items</span>
                      <span className="text-[10px] font-normal text-neutral-500">Normal Stock</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Click to {agingBracket === '31-60' ? 'remove filter' : 'filter table'}</div>
                  </button>

                  {/* Card 3: 61 - 90 Days */}
                  <button
                    type="button"
                    onClick={() => handleCardBracketClick('61-90')}
                    className={`p-3 rounded border text-left transition-all relative overflow-hidden cursor-pointer ${
                      agingBracket === '61-90'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/50 shadow-sm'
                        : 'bg-[#f4f8fc] dark:bg-slate-800/60 border-neutral-300 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        61 - 90 Days Stock
                      </div>
                      {agingBracket === '61-90' && (
                        <span className="text-[9px] font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg text-amber-700 dark:text-amber-400 mt-1 flex items-baseline justify-between">
                      <span>{data.summary.bracket61_90} Items</span>
                      <span className="text-[10px] font-normal text-amber-600">Aging Alert</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Click to {agingBracket === '61-90' ? 'remove filter' : 'filter table'}</div>
                  </button>

                  {/* Card 4: 90+ Days */}
                  <button
                    type="button"
                    onClick={() => handleCardBracketClick('90+')}
                    className={`p-3 rounded border text-left transition-all relative overflow-hidden cursor-pointer ${
                      agingBracket === '90+'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/50 shadow-sm'
                        : 'bg-[#f4f8fc] dark:bg-slate-800/60 border-neutral-300 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                        90+ Days (Dead Stock)
                      </div>
                      {agingBracket === '90+' && (
                        <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg text-rose-700 dark:text-rose-400 mt-1 flex items-baseline justify-between">
                      <span>{data.summary.bracket90Plus} Items</span>
                      <span className="text-[10px] font-normal text-rose-600">Action Needed</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Click to {agingBracket === '90+' ? 'remove filter' : 'filter table'}</div>
                  </button>

                  {/* Card 5: Tied Capital */}
                  <div className="p-3 rounded border border-neutral-300 dark:border-slate-700 bg-[#f4f8fc] dark:bg-slate-800/60">
                    <div className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400">
                      Dead Stock Tied Capital
                    </div>
                    <div className="font-mono font-bold text-lg text-rose-600 dark:text-rose-400 mt-1">
                      {formatMoney(data.summary.deadStockTiedCapital)}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Capital blocked in unsold stock</div>
                  </div>
                </div>
              )}

              {/* Dedicated Filter & Custom Date / Days Control Bar */}
              <div className="bg-[#eef5fa] dark:bg-slate-900 p-2.5 rounded border border-neutral-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                
                {/* Left: Quick Age Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 text-[11px] mr-1">
                    <Filter className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Filter:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setAgingBracket('ALL')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      agingBracket === 'ALL'
                        ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-neutral-200 dark:text-neutral-900'
                        : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-slate-600 hover:bg-neutral-100'
                    }`}
                  >
                    All ({data?.items?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgingBracket('0-30')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      agingBracket === '0-30'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-neutral-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    0-30d ({data?.summary?.bracket0_30 ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgingBracket('31-60')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      agingBracket === '31-60'
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border-neutral-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                    }`}
                  >
                    31-60d ({data?.summary?.bracket31_60 ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgingBracket('61-90')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      agingBracket === '61-90'
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-neutral-300 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    61-90d ({data?.summary?.bracket61_90 ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgingBracket('90+')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      agingBracket === '90+'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-neutral-300 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    90+d Dead ({data?.summary?.bracket90Plus ?? 0})
                  </button>
                </div>

                {/* Middle: Custom Date (Last Sale Date) & Custom Days */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-neutral-300 dark:border-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">Last Sale:</span>
                    <input
                      type="date"
                      value={agingFromDate}
                      onChange={(e) => setAgingFromDate(e.target.value)}
                      title="Last sale date from"
                      className="h-5 px-1 text-[11px] bg-transparent border-b border-neutral-300 dark:border-slate-600 outline-none"
                    />
                    <span className="text-[10px] text-neutral-400">to</span>
                    <input
                      type="date"
                      value={agingToDate}
                      onChange={(e) => setAgingToDate(e.target.value)}
                      title="Last sale date to"
                      className="h-5 px-1 text-[11px] bg-transparent border-b border-neutral-300 dark:border-slate-600 outline-none"
                    />
                    {(agingFromDate || agingToDate) && (
                      <button
                        type="button"
                        onClick={() => { setAgingFromDate(''); setAgingToDate(''); }}
                        className="text-neutral-400 hover:text-rose-600 text-xs ml-0.5 cursor-pointer"
                        title="Clear date filter"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-neutral-300 dark:border-slate-600">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-300">Days:</span>
                    <input
                      type="number"
                      min="0"
                      value={agingMinDays}
                      onChange={(e) => setAgingMinDays(e.target.value)}
                      placeholder="Min"
                      title="Minimum age in days"
                      className="w-12 h-5 px-1 text-[11px] bg-transparent border-b border-neutral-300 dark:border-slate-600 outline-none text-center"
                    />
                    <span className="text-[10px] text-neutral-400">-</span>
                    <input
                      type="number"
                      min="0"
                      value={agingMaxDays}
                      onChange={(e) => setAgingMaxDays(e.target.value)}
                      placeholder="Max"
                      title="Maximum age in days"
                      className="w-12 h-5 px-1 text-[11px] bg-transparent border-b border-neutral-300 dark:border-slate-600 outline-none text-center"
                    />
                    {(agingMinDays !== '' || agingMaxDays !== '') && (
                      <button
                        type="button"
                        onClick={() => { setAgingMinDays(''); setAgingMaxDays(''); }}
                        className="text-neutral-400 hover:text-rose-600 text-xs ml-0.5 cursor-pointer"
                        title="Clear days filter"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {isAgingFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetAgingFilters}
                      className="h-7 px-2.5 bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 text-neutral-800 dark:text-neutral-200 font-bold rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {/* Right: Search & Count */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={agingSearch}
                      onChange={(e) => setAgingSearch(e.target.value)}
                      placeholder="Search product / SKU..."
                      className="h-7 pl-7 pr-6 w-44 text-xs bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 rounded outline-none focus:border-emerald-600"
                    />
                    {agingSearch && (
                      <button
                        type="button"
                        onClick={() => setAgingSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-neutral-500 whitespace-nowrap">
                    Showing {filteredAgingItems.length} of {data?.items?.length || 0}
                  </span>
                </div>
              </div>

              <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                    <tr>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">SKU</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">Barcode</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700">Product Name</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Current Stock</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-28">Last Sale Date</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Age (Days)</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-36">Age Bracket</th>
                      <th className="py-2 px-3 text-right w-32">Stock Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                    {loading || !data?.items ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Calculating stock aging metrics...
                        </td>
                      </tr>
                    ) : filteredAgingItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                          <p className="font-bold text-sm text-neutral-600 dark:text-neutral-400">No items match the selected age filter.</p>
                          <p className="text-xs text-neutral-400 mt-1">Try adjusting the age bracket, custom date, or days range.</p>
                          <button
                            type="button"
                            onClick={handleResetAgingFilters}
                            className="mt-3 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs shadow cursor-pointer inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Show All Products</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredAgingItems.map((item: any, idx: number) => {
                        const bracket = item.ageBracket || '0-30 Days';
                        return (
                          <tr key={item.id || idx} className="hover:bg-neutral-50 dark:hover:bg-slate-900/60 transition-colors">
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-500">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                              {item.sku}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              {item.barcode}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-bold">
                              {item.name}
                              <span className="text-[10px] font-normal text-neutral-500 block">{item.company} • {item.category}</span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-[11px]">
                              {item.lastSaleDate || '—'}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold">
                              {item.ageDays ?? 0} Days
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                bracket.includes('90+') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                bracket.includes('61') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                bracket.includes('31') ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {bracket}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                              {formatMoney(item.totalValuation)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FAST & SLOW MOVING ITEMS */}
          {activeTab === 'velocity' && (
            <div className="space-y-3">
              {data?.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#f4f8fc] dark:bg-slate-800/60 p-3 rounded border border-neutral-300 dark:border-slate-700 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-600">Fast-Moving Items (⚡)</div>
                    <div className="font-bold text-lg text-emerald-700 dark:text-emerald-400 mt-0.5">{data.summary.fastMovingCount} Products</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-600">Moderate Sales Items</div>
                    <div className="font-bold text-lg text-blue-700 dark:text-blue-400 mt-0.5">{data.summary.moderateCount} Products</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-600">Slow-Moving Items</div>
                    <div className="font-bold text-lg text-amber-700 dark:text-amber-400 mt-0.5">{data.summary.slowMovingCount} Products</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-rose-600">Dead Stock (0 Sales 60d)</div>
                    <div className="font-bold text-lg text-rose-700 dark:text-rose-400 mt-0.5">{data.summary.deadStockCount} Products</div>
                  </div>
                </div>
              )}

              <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                    <tr>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">SKU</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 w-28">Barcode</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700">Product Name</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Stock</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-28">60-Days Volume</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Revenue (60d)</th>
                      <th className="py-2 px-3 text-center w-36">Movement Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                    {loading || !data?.items ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Analyzing product sales velocity...
                        </td>
                      </tr>
                    ) : data.items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500 font-bold">
                          No product velocity data available.
                        </td>
                      </tr>
                    ) : (
                      data.items.map((item: any, idx: number) => {
                        const velocityCat = item.velocityCategory || 'MODERATE';
                        return (
                          <tr key={item.id || idx} className="hover:bg-neutral-50 dark:hover:bg-slate-900/60 transition-colors">
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-500">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                              {item.sku}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              {item.barcode}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-bold">
                              {item.name}
                              <span className="text-[10px] font-normal text-neutral-500 block">{item.company} • {item.category}</span>
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold">
                              {item.currentStock} {item.unit}
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {item.unitsSold60Days ?? 0} Pcs
                            </td>
                            <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold">
                              {formatMoney(item.revenue60Days)}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                velocityCat === 'FAST_MOVING' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                velocityCat === 'MODERATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                velocityCat === 'SLOW_MOVING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                {String(velocityCat).replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SALESPERSON / USER PERFORMANCE */}
          {activeTab === 'user' && (
            <div className="space-y-3">
              <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                    <tr>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700">Salesperson / Staff Name</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Role</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-28">Invoices Count</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-32">Sales Revenue</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-32">Collected Amount</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Due Balance</th>
                      <th className="py-2 px-3 text-right w-32">Avg Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                    {loading || !data?.users ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Calculating staff performance analytics...
                        </td>
                      </tr>
                    ) : data.users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500 font-bold">
                          No staff performance data available.
                        </td>
                      </tr>
                    ) : (
                      data.users.map((u: any, idx: number) => (
                        <tr key={u.userId || idx} className="hover:bg-neutral-50 dark:hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-neutral-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 font-bold text-neutral-900 dark:text-neutral-100">
                            {u.userName}
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono text-[10px] uppercase font-bold text-neutral-600">
                            {u.userRole}
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold">
                            {u.salesCount} Invoices
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {formatMoney(u.totalRevenue)}
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatMoney(u.totalCollected)}
                          </td>
                          <td className="py-2 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold text-red-600">
                            {formatMoney(u.totalDue)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                            {formatMoney(u.avgOrderValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

export interface StockAgingReorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: 'reorder' | 'aging' | 'velocity' | 'user';
  onOpenPurchaseWithProduct?: (sku: string) => void;
}

export function StockAgingReorderModal({
  open,
  onOpenChange,
  initialTab = 'reorder',
  onOpenPurchaseWithProduct,
}: StockAgingReorderModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="p-0 max-w-5xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl text-xs text-neutral-900 dark:text-neutral-100 select-none">
        <StockAgingReportView
          initialTab={initialTab}
          onOpenPurchaseWithProduct={onOpenPurchaseWithProduct}
          embedded={false}
          onClose={() => onOpenChange(false)}
        />
      </div>
    </Dialog>
  );
}
