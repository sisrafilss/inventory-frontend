'use client';
import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, StockMovement, StockMovementType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/context/language-context';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProductCombobox } from '@/components/ui/product-combobox';
import {
  Boxes,
  PlusCircle,
  History,
  AlertTriangle,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const canAdjust = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Overview state
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingMoreOverview, setLoadingMoreOverview] = useState(false);
  const [overviewPage, setOverviewPage] = useState(1);
  const [overviewMeta, setOverviewMeta] = useState({ total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProductRow, setSelectedProductRow] = useState<any>(null);

  // History state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, totalPages: 1 });
  const [historyFilterType, setHistoryFilterType] = useState('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [selectedMovementRow, setSelectedMovementRow] = useState<StockMovement | null>(null);

  // Adjustment Modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustSelectedProduct, setAdjustSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState<number | ''>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showConfirmAdjust, setShowConfirmAdjust] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setOverviewPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on tab/filter change
  useEffect(() => {
    if (activeTab === 'overview') {
      // overview changes covered by debouncedSearch
    } else {
      setHistoryPage(1);
    }
  }, [activeTab, historyFilterType, historyStartDate, historyEndDate]);

  const fetchOverview = async () => {
    try {
      if (overviewPage === 1) setLoadingOverview(true);
      else setLoadingMoreOverview(true);
      
      const res = await api.get<{ summary: any; products: any[]; meta: any }>('/inventory/overview', {
        page: overviewPage,
        limit: 30,
        search: debouncedSearch || undefined,
      });
      
      setSummary(res.data.summary);
      if (overviewPage === 1) {
        setProducts(res.data.products);
      } else {
        setProducts((prev) => [...prev, ...res.data.products]);
      }
      
      if (res.data.meta) {
        setOverviewMeta({
          total: res.data.meta.total || 0,
          totalPages: res.data.meta.totalPages || 1,
        });
      }
    } catch (err: any) {
      toast.error('Failed to load inventory overview');
    } finally {
      setLoadingOverview(false);
      setLoadingMoreOverview(false);
    }
  };

  const fetchHistory = async () => {
    try {
      if (historyPage === 1) setLoadingHistory(true);
      else setLoadingMoreHistory(true);
      
      const res = await api.get<StockMovement[]>('/inventory/history', {
        page: historyPage,
        limit: 30,
        type: historyFilterType !== 'ALL' ? historyFilterType : undefined,
        startDate: historyStartDate || undefined,
        endDate: historyEndDate || undefined,
      });
      
      if (historyPage === 1) {
        setMovements(res.data);
      } else {
        setMovements((prev) => [...prev, ...res.data]);
      }
      
      if (res.meta) {
        setHistoryMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
        });
      }
    } catch (err: any) {
      toast.error('Failed to load stock history');
    } finally {
      setLoadingHistory(false);
      setLoadingMoreHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else {
      fetchHistory();
    }
  }, [activeTab, overviewPage, historyPage, debouncedSearch, historyFilterType, historyStartDate, historyEndDate]);

  const handleOverviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loadingOverview && !loadingMoreOverview && overviewPage < overviewMeta.totalPages) {
      setOverviewPage((p) => p + 1);
    }
  };

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loadingHistory && !loadingMoreHistory && historyPage < historyMeta.totalPages) {
      setHistoryPage((p) => p + 1);
    }
  };

  // Preview logic
  const qtyBefore = adjustSelectedProduct?.quantity || 0;
  const parsedAdjustQty = Number(adjustQty) || 0;
  const isDeduction = ['DAMAGE', 'LOSS', 'SALE_DEDUCTION'].includes(adjustType);
  const change = isDeduction ? -parsedAdjustQty : parsedAdjustQty;
  const qtyAfter = qtyBefore + change;

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !adjustSelectedProduct) {
      toast.error('Please select a product.');
      return;
    }
    if (parsedAdjustQty <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    if (qtyAfter < 0) {
      toast.error('Adjustment cannot reduce stock below zero.');
      return;
    }
    setShowConfirmAdjust(true);
  };

  const executeAdjustment = async () => {
    setShowConfirmAdjust(false);
    setIsAdjusting(true);
    try {
      await api.post('/inventory/adjust', {
        productId: selectedProductId,
        type: adjustType,
        quantity: parsedAdjustQty,
        reason: adjustReason,
      });
      toast.success('Stock adjusted successfully.');
      setAdjustOpen(false);
      
      // Reset Modal Form
      setSelectedProductId('');
      setAdjustSelectedProduct(null);
      setAdjustQty(1);
      setAdjustReason('');
      setAdjustType('RESTOCK');
      
      // Refresh Data
      if (activeTab === 'overview') {
        if (overviewPage === 1) fetchOverview();
        else setOverviewPage(1);
      } else {
        if (historyPage === 1) fetchHistory();
        else setHistoryPage(1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openQuickAdjust = (product: any) => {
    setSelectedProductId(product.id);
    setAdjustSelectedProduct(product);
    setAdjustType('RESTOCK');
    setAdjustQty(1);
    setAdjustReason('');
    setAdjustOpen(true);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <Boxes className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">{t('inventory.title')}</h1>
          </div>
          {canAdjust && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdjustOpen(true)}
                className="px-2.5 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t('inventory.adjustStock')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Summary KPI Panel (Only shows when Overview is active) */}
        {activeTab === 'overview' && summary && (
          <div className="bg-[#b0c8de] dark:bg-slate-800/80 p-2 border-b border-[#9fbcd6] dark:border-slate-700 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white dark:bg-slate-900 border border-[#9fbcd6] dark:border-slate-700 p-2 shadow-sm rounded-xs">
              <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Total Items</p>
              <h3 className="text-lg font-bold text-[#006400] dark:text-emerald-400 font-mono leading-none mt-1">
                {summary.totalQuantity} <span className="text-xs font-sans text-neutral-500">units</span>
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#9fbcd6] dark:border-slate-700 p-2 shadow-sm rounded-xs">
              <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Total Cost Value</p>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-mono leading-none mt-1">
                {formatMoney(summary.totalCostValue)}
              </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-[#9fbcd6] dark:border-slate-700 p-2 shadow-sm rounded-xs">
              <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Retail Valuation</p>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-mono leading-none mt-1">
                {formatMoney(summary.totalRetailValue)}
              </h3>
            </div>
            <div className="bg-[#fff0f0] dark:bg-rose-950/20 border border-[#ffcccc] dark:border-rose-900 p-2 shadow-sm rounded-xs">
              <p className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Low Stock
              </p>
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-500 font-mono leading-none mt-1">
                {summary.lowStockCount + summary.outOfStockCount} <span className="text-xs font-sans text-rose-500">items</span>
              </h3>
            </div>
          </div>
        )}

        {/* Tab & Filter Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/60 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-3 items-center justify-between text-sm">
          {/* Tabs */}
          <div className="flex bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs overflow-hidden shrink-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors uppercase tracking-wider ${
                activeTab === 'overview' ? 'bg-[#0056b3] text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
            >
              Current Stock
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-bold border-l border-neutral-400 dark:border-slate-600 transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#0056b3] text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Movement History
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="flex items-center gap-1.5 flex-1 max-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3] text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              >
                <option value="ALL">All Movements</option>
                <option value="RESTOCK">Restock</option>
                <option value="DAMAGE">Damage</option>
                <option value="LOSS">Loss</option>
                <option value="RETURN">Return</option>
                <option value="CORRECTION">Correction</option>
                <option value="SALE_DEDUCTION">Sale Deduction</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </select>
              <span className="text-neutral-400 mx-1">|</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              />
              <span className="text-neutral-500 font-bold">-</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              />
            </div>
          )}
        </div>

        {/* Data Table Area */}
        <div 
          className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-950 relative custom-scrollbar"
          onScroll={activeTab === 'overview' ? handleOverviewScroll : handleHistoryScroll}
        >
          {activeTab === 'overview' ? (
            <table className="w-full text-xs text-left min-w-[900px] border-collapse relative">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                <tr>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28">SKU / Code</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">Product Name</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">Category</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">In Stock</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">Unit Cost (৳)</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">Total Value (৳)</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">Status</th>
                  {canAdjust && <th className="px-3 py-1.5 w-24 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {loadingOverview && overviewPage === 1 ? (
                  <tr>
                    <td colSpan={canAdjust ? 9 : 8} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                        <span>Loading current stock...</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={canAdjust ? 9 : 8} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="w-8 h-8 text-neutral-400" />
                        <span>No products found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {products.map((p, idx) => {
                      const isSelected = selectedProductRow?.id === p.id;
                      const statusColor = 
                        p.stockStatus === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        p.stockStatus === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300';
                      
                      const statusColorSelected = 
                        p.stockStatus === 'IN_STOCK' ? 'bg-emerald-600 text-white border-emerald-500' :
                        p.stockStatus === 'LOW_STOCK' ? 'bg-amber-600 text-white border-amber-500' :
                        'bg-rose-600 text-white border-rose-500';

                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#0056b3] text-white font-semibold'
                              : idx % 2 === 0
                              ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                              : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                          }`}
                          onClick={() => setSelectedProductRow(p)}
                          onDoubleClick={() => canAdjust && openQuickAdjust(p)}
                          title={canAdjust ? "Double-click to quick-adjust stock" : ""}
                        >
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 font-mono font-bold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{p.sku}</td>
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 font-semibold">{p.name}</td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 truncate max-w-[120px] ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {p.category?.name || '—'}
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-right font-mono font-bold ${isSelected ? 'text-white' : p.quantity <= p.reorderLevel ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {p.quantity} <span className="text-[10px] font-sans font-normal opacity-80">{p.unit}</span>
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-right font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {Number(p.costPrice).toFixed(2)}
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-right font-mono font-bold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                            {Number(p.inventoryValue).toFixed(2)}
                          </td>
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1 text-center">
                            <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border whitespace-nowrap ${isSelected ? statusColorSelected : statusColor}`}>
                              {p.stockStatus.replace('_', ' ')}
                            </span>
                          </td>
                          {canAdjust && (
                            <td className="px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openQuickAdjust(p); }}
                                className={`px-2 py-0.5 rounded-xs border text-[10px] font-bold transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-[#0056b3] border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                              >
                                Adjust
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {loadingMoreOverview && (
                      <tr>
                        <td colSpan={canAdjust ? 9 : 8} className="py-4 text-center text-neutral-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                            <span>Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-left min-w-[950px] border-collapse relative">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                <tr>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">Timestamp</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">Product</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">Movement Type</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">Change</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-center">Before → After</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">Performed By</th>
                  <th className="px-3 py-1.5 min-w-[150px]">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {loadingHistory && historyPage === 1 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                        <span>Loading movement history...</span>
                      </div>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <History className="w-8 h-8 text-neutral-400" />
                        <span>No movement records found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {movements.map((m, idx) => {
                      const isSelected = selectedMovementRow?.id === m.id;
                      const isPositive = m.quantityChange > 0;
                      const isNegative = m.quantityChange < 0;

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#0056b3] text-white font-semibold'
                              : idx % 2 === 0
                              ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                              : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                          }`}
                          onClick={() => setSelectedMovementRow(m)}
                        >
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {formatDate(m.createdAt)}
                          </td>
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{m.product.name}</span>
                            <span className={`block text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{m.product.sku}</span>
                          </td>
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                              isPositive
                                ? isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isNegative
                                ? isSelected ? 'bg-rose-600 text-white border-rose-500' : 'bg-rose-100 text-rose-800 border-rose-300'
                                : isSelected ? 'bg-neutral-600 text-white border-neutral-500' : 'bg-neutral-200 text-neutral-800 border-neutral-400'
                            }`}>
                              {m.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-bold font-mono ${
                            isSelected ? 'text-white' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-600 dark:text-neutral-400'
                          }`}>
                            <span className="flex items-center justify-center gap-0.5">
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : isNegative ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
                              {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                            </span>
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {m.quantityBefore} <span className="text-neutral-400">→</span> <strong className={isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}>{m.quantityAfter}</strong>
                          </td>
                          <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                            <span className="font-medium block leading-tight">{m.performedBy.name}</span>
                            <span className="text-[10px] uppercase opacity-75">{m.performedBy.role}</span>
                          </td>
                          <td className={`px-3 py-1.5 truncate max-w-[200px] ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                            {m.reason || '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {loadingMoreHistory && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-neutral-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                            <span>Loading more...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Status / Summary Bar */}
        <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-blue-900 dark:text-blue-300">
              Loaded <strong>{activeTab === 'overview' ? products.length : movements.length}</strong> total of <strong>{activeTab === 'overview' ? overviewMeta.total : historyMeta.total}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
            {activeTab === 'overview' && selectedProductRow ? (
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedProductRow.sku} - {selectedProductRow.name}
              </span>
            ) : activeTab === 'history' && selectedMovementRow ? (
              <span className="bg-[#0056b3] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedMovementRow.product.name} ({selectedMovementRow.quantityChange > 0 ? '+' : ''}{selectedMovementRow.quantityChange})
              </span>
            ) : (
              <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                Tip: Single-click a row to highlight
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Retro Adjust Stock Modal */}
      <Dialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleAdjustSubmit} className="flex flex-col">
          {/* Header */}
          <div
            data-drag-handle
            className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <h2 className="text-lg font-bold text-white tracking-wide">Adjust Stock Level</h2>
            <button
              type="button"
              onClick={() => setAdjustOpen(false)}
              disabled={isAdjusting}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            
            {/* Product Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Select Product <span className="text-rose-600">*</span>
              </label>
              <div className="bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs">
                <ProductCombobox
                  value={selectedProductId}
                  selectedProduct={adjustSelectedProduct}
                  onSelect={(p) => {
                    setSelectedProductId(p.id);
                    setAdjustSelectedProduct(p);
                  }}
                  onClear={() => {
                    setSelectedProductId('');
                    setAdjustSelectedProduct(null);
                  }}
                  placeholder="Search by name, SKU, or barcode..."
                />
              </div>
            </div>

            {/* Type & Qty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Adjustment Type <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                  className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                >
                  <option value="RESTOCK">Restock (Add)</option>
                  <option value="DAMAGE">Damage (Deduct)</option>
                  <option value="LOSS">Loss (Deduct)</option>
                  <option value="RETURN">Return (Add)</option>
                  <option value="CORRECTION">Correction (Override)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Quantity Change <span className="text-rose-600">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="e.g. 5"
                  className="w-full h-8 px-2 text-sm font-mono font-bold border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
                />
              </div>
            </div>

            {/* Preview Box */}
            {adjustSelectedProduct ? (
              <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 p-3 rounded-xs shadow-sm font-mono text-sm space-y-1.5 text-neutral-800 dark:text-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="font-sans font-semibold">Current Stock:</span>
                  <span className="font-bold">{qtyBefore} {adjustSelectedProduct.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans font-semibold">Calculated Change:</span>
                  <span className={`font-bold ${change > 0 ? 'text-emerald-700' : change < 0 ? 'text-rose-700' : ''}`}>
                    {change > 0 ? `+${change}` : change} {adjustSelectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-amber-200 dark:border-amber-800 pt-1.5 mt-1.5">
                  <span className="font-sans font-bold uppercase">New Expected Stock:</span>
                  <span className={`font-bold text-base ${qtyAfter < 0 ? 'text-rose-600' : 'text-neutral-900 dark:text-white'}`}>
                    {qtyAfter} {adjustSelectedProduct.unit}
                  </span>
                </div>
                {qtyAfter < 0 && (
                  <p className="text-rose-600 dark:text-rose-400 font-sans font-bold text-[11px] pt-1">
                    ⚠ Warning: Stock cannot be reduced below zero.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 p-3 rounded-xs text-center text-xs text-neutral-500 font-sans">
                Select a product to see stock preview.
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Reason / Reference <span className="text-rose-600">*</span>
              </label>
              <input
                required
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Broken in transit, Audited stock"
                className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#006400]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-300 dark:border-slate-700 mt-2">
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                disabled={isAdjusting}
                className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdjusting || qtyAfter < 0 || !adjustReason.trim() || !selectedProductId}
                className="w-32 h-8 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:bg-neutral-400 disabled:border-neutral-500"
              >
                {isAdjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isAdjusting ? 'Processing' : 'Commit'}
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmAdjust}
        onOpenChange={(isOpen) => !isAdjusting && setShowConfirmAdjust(isOpen)}
        title="Confirm Stock Adjustment"
        description="Please confirm you want to proceed with this inventory adjustment. This action will log a stock movement."
        onConfirm={executeAdjustment}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="success"
        isLoading={isAdjusting}
        loadingText="Saving..."
        details={adjustSelectedProduct ? [
          { label: 'Product:', value: adjustSelectedProduct.name },
          { label: 'Movement:', value: adjustType.replace('_', ' ') },
          { label: 'Change:', value: `${change > 0 ? '+' : ''}${change} ${adjustSelectedProduct.unit}` },
          { label: 'New Stock:', value: `${qtyAfter} ${adjustSelectedProduct.unit}`, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Reason:', value: adjustReason },
        ] : []}
      />
    </div>
  );
}
