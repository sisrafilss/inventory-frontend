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

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
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
      const headers = ['SKU', 'Barcode', 'Product Name', 'Category', 'Current Stock', 'Last Sale Date', 'Age (Days)', 'Age Bracket', 'Stock Valuation'];
      const rows = (data.items || []).map((i: any) => [
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 font-bold rounded-xs text-xs flex items-center gap-1.5 transition-colors uppercase tracking-wider ${
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
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Checking stock reorder levels...
                        </td>
                      </tr>
                    ) : (data?.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-emerald-700 font-bold">
                          ✓ All inventory items are sufficiently stocked above reorder levels.
                        </td>
                      </tr>
                    ) : (
                      (data?.items || []).map((item: any, idx: number) => (
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
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#f4f8fc] dark:bg-slate-800/60 p-3 rounded border border-neutral-300 dark:border-slate-700 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">0 - 30 Days Stock</div>
                    <div className="font-bold text-lg text-emerald-600 mt-0.5">{data.summary.bracket0_30} Items</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">31 - 60 Days Stock</div>
                    <div className="font-bold text-lg text-blue-600 mt-0.5">{data.summary.bracket31_60} Items</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">61 - 90 Days Stock</div>
                    <div className="font-bold text-lg text-amber-600 mt-0.5">{data.summary.bracket61_90} Items</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">90+ Days (Dead Stock)</div>
                    <div className="font-bold text-lg text-rose-600 mt-0.5">{data.summary.bracket90Plus} Items</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-500">Dead Stock Tied Capital</div>
                    <div className="font-mono font-bold text-lg text-rose-600 mt-0.5">{formatMoney(data.summary.deadStockTiedCapital)}</div>
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
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Current Stock</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-28">Last Sale Date</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Age (Days)</th>
                      <th className="py-2 px-3 border-r border-neutral-300 dark:border-slate-700 text-center w-36">Age Bracket</th>
                      <th className="py-2 px-3 text-right w-32">Stock Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Calculating stock aging metrics...
                        </td>
                      </tr>
                    ) : (data?.items || []).map((item: any, idx: number) => (
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
                          {item.lastSaleDate}
                        </td>
                        <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center font-mono font-bold">
                          {item.ageDays} Days
                        </td>
                        <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            item.ageBracket.includes('90+') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            item.ageBracket.includes('61') ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            item.ageBracket.includes('31') ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {item.ageBracket}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {formatMoney(item.totalValuation)}
                        </td>
                      </tr>
                    ))}
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
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Analyzing product sales velocity...
                        </td>
                      </tr>
                    ) : (data?.items || []).map((item: any, idx: number) => (
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
                          {item.unitsSold60Days} Pcs
                        </td>
                        <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold">
                          {formatMoney(item.revenue60Days)}
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            item.velocityCategory === 'FAST_MOVING' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            item.velocityCategory === 'MODERATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            item.velocityCategory === 'SLOW_MOVING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {item.velocityCategory.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
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
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-neutral-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-700" />
                          Calculating staff performance analytics...
                        </td>
                      </tr>
                    ) : (data?.users || []).map((u: any, idx: number) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
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
