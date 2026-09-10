'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import {
  LayoutDashboard,
  Boxes,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Package,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  Truck,
  FileText,
  Clock,
  ArrowRight,
  Layers,
  Layers3,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Date Display
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center bg-[#c6d8ea] dark:bg-slate-900 border border-[#004d00] dark:border-emerald-900 rounded-xs">
        <div className="w-9 h-9 border-3 border-[#006400] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-neutral-800 dark:text-neutral-200 mt-2 font-bold font-mono">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center p-6 bg-[#c6d8ea] dark:bg-slate-900 border border-[#800000] dark:border-rose-900 rounded-xs">
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-[#800000] rounded-xs shadow-md text-center max-w-md space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="px-4 py-1.5 bg-[#006400] hover:bg-[#004d00] text-white text-xs font-bold rounded-xs shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('common.retry')}</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentSales = data?.recentSales || [];
  const recentAdjustments = data?.recentAdjustments || [];

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* 1. Classic Dark Green Title Header Bar */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <LayoutDashboard className="w-5 h-5 text-emerald-200 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wide leading-tight">
                  {t('dashboard.welcome') || 'EXECUTIVE & OPERATIONS DASHBOARD'}
                </h1>
                <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded-xs font-mono font-bold border border-emerald-700">
                  ERP v1.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                {t('dashboard.welcomeBack')}, <span className="font-bold text-white">{user?.name}</span> ({user?.role || 'OPERATOR'}) • {t('dashboard.overviewSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/sales">
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('dashboard.quickNewSale')}</span>
              </button>
            </Link>
            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-bold bg-[#004d00] hover:bg-[#003d00] text-white border border-emerald-700 shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('common.refresh') || 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* 2. ERP Quick Function Shortcuts Toolbar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 p-1.5 px-3 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-2 items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
            <span className="font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-[11px] flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              Quick Links:
            </span>
            <Link href="/sales" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <ShoppingCart className="w-3 h-3 text-emerald-600" />
              <span>[F1] Sales</span>
            </Link>
            <Link href="/purchases" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <Truck className="w-3 h-3 text-blue-600" />
              <span>[F2] Purchases</span>
            </Link>
            <Link href="/products" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <Package className="w-3 h-3 text-purple-600" />
              <span>[F3] Products</span>
            </Link>
            <Link href="/inventory" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <Boxes className="w-3 h-3 text-amber-600" />
              <span>[F4] Inventory</span>
            </Link>
            <Link href="/parties" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>[F5] Parties</span>
            </Link>
            <Link href="/reports" className="h-6 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 hover:border-[#006400] text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs flex items-center gap-1 transition-colors shadow-xs">
              <FileText className="w-3 h-3 text-teal-600" />
              <span>[F6] Reports</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              {currentDate}
            </span>
            <span className="hidden md:inline px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold rounded-xs text-[10px]">
              ONLINE • SYNCED
            </span>
          </div>
        </div>

        {/* 3. Main Scrollable Dashboard Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-[#e4edf5] dark:bg-slate-950 custom-scrollbar">
          
          {/* KPI Metrics Dense Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            
            {/* Tile 1: Today's Sales */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  {t('dashboard.todaySalesValue')}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1 rounded-xs font-mono font-bold">
                  {stats.todaySalesCount || 0} {t('dashboard.orders') || 'Orders'}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                  {formatMoney(stats.todaySalesAmount || 0)}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Gross Sales Recorded Today
                </div>
              </div>
            </div>

            {/* Tile 2: Monthly Sales */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  {t('dashboard.monthSalesTotal')}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                  {formatMoney(stats.monthSalesAmount || 0)}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Current Month Revenue
                </div>
              </div>
            </div>

            {/* Tile 3: Total Stock Items */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-purple-600" />
                  {t('dashboard.totalStockQuantity')}
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1 rounded-xs font-mono font-bold">
                  {stats.productsCount || 0} SKUs
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                  {Number(stats.inventoryQuantity || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Total Units Across Warehouses
                </div>
              </div>
            </div>

            {/* Tile 4: Active Products */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-neutral-600" />
                  {t('dashboard.activeProducts')}
                </span>
                <span className="text-[10px] bg-neutral-200 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 px-1 rounded-xs font-mono font-bold">
                  {stats.categoriesCount || 0} Cats
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                  {stats.productsCount || 0}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Active Product Records
                </div>
              </div>
            </div>

            {/* Tile 5: Cost Valuation */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Layers3 className="w-3.5 h-3.5 text-teal-600" />
                  {t('dashboard.estCostValuation')}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                  {formatMoney(stats.inventoryCostValue || 0)}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">
                  Total In-Stock Asset Value
                </div>
              </div>
            </div>

            {/* Tile 6: Low Stock / Out of Stock Alert */}
            <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xs shadow-xs overflow-hidden flex flex-col">
              <div className="px-2 py-1 bg-[#fef2f2] dark:bg-rose-950/50 border-b border-red-200 dark:border-rose-900 flex items-center justify-between text-[11px] font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  {t('dashboard.lowOutOfStock')}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="text-xl font-mono font-extrabold text-red-600 dark:text-red-400">
                  {(stats.lowStockCount || 0) + (stats.outOfStockCount || 0)}
                </div>
                <div className="text-[10px] text-red-600/80 font-mono mt-1 flex items-center justify-between">
                  <span>Low: {stats.lowStockCount || 0}</span>
                  <span>Out: {stats.outOfStockCount || 0}</span>
                </div>
              </div>
            </div>

          </div>

          {/* 4. Two Column Operational Split: Recent Sales Ledger + Stock Adjustments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Left Column: Recent Sales Activity Ledger (8 Cols) */}
            <div className="lg:col-span-8 border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xs flex flex-col shadow-xs overflow-hidden">
              
              {/* Header Bar */}
              <div className="bg-[#004d00] dark:bg-emerald-950 text-white px-3 py-1.5 flex items-center justify-between border-b border-[#003d00] shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-200" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {t('dashboard.recentSalesTitle')}
                  </span>
                  <span className="text-[10px] bg-[#006400] text-white px-1.5 py-0.2 rounded-xs font-mono font-bold">
                    {recentSales.length} {t('sales.lines') || 'records'}
                  </span>
                </div>
                <Link
                  href="/sales"
                  className="text-[11px] text-emerald-200 hover:text-white font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <span>{t('dashboard.viewAllSales')}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto overflow-y-auto max-h-[380px] custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">
                        {t('common.sn')}
                      </th>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[130px]">
                        {t('dashboard.refNumber')}
                      </th>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[130px]">
                        {t('common.date')}
                      </th>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[130px]">
                        {t('dashboard.createdBy')}
                      </th>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">
                        {t('common.status')}
                      </th>
                      <th className="border-b border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right min-w-[120px]">
                        {t('dashboard.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-neutral-500 italic">
                          {t('dashboard.noSalesFound')}
                        </td>
                      </tr>
                    ) : (
                      recentSales.map((sale: any, idx: number) => (
                        <tr
                          key={sale.id}
                          className="border-b border-neutral-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-2 text-center text-neutral-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-2 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                            {sale.referenceNumber}
                          </td>
                          <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-2 text-neutral-600 dark:text-neutral-400 text-[11px] font-mono">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-2 font-medium text-neutral-800 dark:text-neutral-200">
                            {sale.createdBy?.name || '—'}
                          </td>
                          <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-2 text-center">
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 font-bold uppercase rounded-xs border ${
                                sale.status === 'COMPLETED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-red-100 dark:bg-rose-950 text-red-800 dark:text-red-300 border-red-300 dark:border-rose-800'
                              }`}
                            >
                              {sale.status === 'COMPLETED'
                                ? t('statuses.COMPLETED')
                                : t('statuses.CANCELLED')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                            {formatMoney(sale.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sub-footer bar */}
              <div className="bg-[#eaf1f8] dark:bg-slate-900 p-1.5 px-3 border-t border-neutral-300 dark:border-slate-700 flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-400 font-mono shrink-0">
                <span>Showing latest {recentSales.length} sales</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  Total: {formatMoney(recentSales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0))}
                </span>
              </div>
            </div>

            {/* Right Column: Recent Stock Movements & Health Panel (4 Cols) */}
            <div className="lg:col-span-4 border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xs flex flex-col shadow-xs overflow-hidden">
              
              {/* Header Bar */}
              <div className="bg-[#1e3a8a] dark:bg-blue-950 text-white px-3 py-1.5 flex items-center justify-between border-b border-blue-900 shrink-0">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-200" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Stock Movements
                  </span>
                </div>
                <Link
                  href="/inventory"
                  className="text-[11px] text-blue-200 hover:text-white font-bold flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <span>Inventory</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Movements Table */}
              <div className="overflow-x-auto overflow-y-auto max-h-[260px] custom-scrollbar flex-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10.5px] font-bold">
                    <tr>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-2 py-1.5">
                        Product
                      </th>
                      <th className="border-r border-b border-neutral-300 dark:border-slate-700 px-2 py-1.5 text-center w-16">
                        Type
                      </th>
                      <th className="border-b border-neutral-300 dark:border-slate-700 px-2 py-1.5 text-right w-16">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-neutral-500 italic">
                          No recent stock movements.
                        </td>
                      </tr>
                    ) : (
                      recentAdjustments.map((item: any) => {
                        const isIncrease = item.type === 'IN' || item.quantity > 0;
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/60"
                          >
                            <td className="border-r border-neutral-200 dark:border-slate-800 px-2 py-1.5">
                              <div className="font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[150px]">
                                {item.product?.name || 'Product'}
                              </div>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                {item.product?.sku || 'SKU'}
                              </div>
                            </td>
                            <td className="border-r border-neutral-200 dark:border-slate-800 px-2 py-1.5 text-center">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono font-bold uppercase ${
                                  item.type === 'IN'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                    : item.type === 'OUT'
                                    ? 'bg-red-100 dark:bg-rose-950 text-red-800 dark:text-red-300'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono font-bold text-xs">
                              <span className={isIncrease ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                {isIncrease ? `+${item.quantity}` : item.quantity}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* System Inventory Summary Box */}
              <div className="p-2.5 bg-[#f0f4f8] dark:bg-slate-900 border-t border-neutral-300 dark:border-slate-700 text-xs space-y-1.5 shrink-0">
                <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Catalog Status</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div className="bg-white dark:bg-slate-800 p-1.5 border border-neutral-300 dark:border-slate-700 rounded-xs">
                    <span className="text-neutral-500 block text-[10px]">RETAIL VALUATION:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {formatMoney(stats.inventoryRetailValue || 0)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-1.5 border border-neutral-300 dark:border-slate-700 rounded-xs">
                    <span className="text-neutral-500 block text-[10px]">LOW/OUT STOCK:</span>
                    <span className={`font-bold ${(stats.lowStockCount || 0) + (stats.outOfStockCount || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>
                      {(stats.lowStockCount || 0) + (stats.outOfStockCount || 0)} items
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* 5. ERP Bottom Status Strip */}
        <div className="bg-[#c6d8ea] dark:bg-slate-900 border-t border-[#004d00]/40 px-3 py-1 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-700 dark:text-neutral-300 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span>
              DB: <span className="font-bold text-emerald-700 dark:text-emerald-400">ONLINE</span>
            </span>
            <span>•</span>
            <span>
              USER: <span className="font-bold text-neutral-900 dark:text-neutral-100">{user?.name}</span>
            </span>
            <span>•</span>
            <span>
              ROLE: <span className="font-bold text-neutral-900 dark:text-neutral-100">{user?.role}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              CURRENCY: <span className="font-bold">BDT (৳)</span>
            </span>
            <span>•</span>
            <span className="text-neutral-500 hidden sm:inline">
              CLASSIC ERP UI SYSTEM
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
