'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { Sale } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { ShoppingCart, Search, Eye, Printer, Loader2, AlertCircle, Package, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceMemoModal } from '@/components/sales/invoice-memo-modal';
import { SaleManualModal } from '@/components/sales/sale-manual-modal';
import { SaleBarcodeModal } from '@/components/sales/sale-barcode-modal';

export default function SalesListPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sale Details Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [highlightedSale, setHighlightedSale] = useState<Sale | null>(null);

  // Modals
  const [memoSale, setMemoSale] = useState<Sale | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [saleManualModalOpen, setSaleManualModalOpen] = useState(false);
  const [saleBarcodeModalOpen, setSaleBarcodeModalOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchSales = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      setError(null);
      const res = await api.get<Sale[]>('/sales', {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      
      if (page === 1) {
        setSales(res.data);
      } else {
        setSales(prev => [...prev, ...res.data]);
      }
      
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchSales();
  }, [page, limit, debouncedSearch, statusFilter]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !loadingMore && page < (meta.totalPages || 1)) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-white" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">{t('sales.salesRegister')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSaleManualModalOpen(true)}
              className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 font-bold text-xs rounded-xs flex items-center gap-1 shadow-sm transition-colors border border-neutral-400"
            >
              {t('sales.saleByManual')}
            </button>
            <button
              type="button"
              onClick={() => setSaleBarcodeModalOpen(true)}
              className="h-7 px-3 bg-[#800000] text-white hover:bg-red-900 font-bold text-xs rounded-xs flex items-center gap-1 shadow-sm transition-colors border border-red-950"
            >
              {t('sales.saleByPos')}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-400 dark:border-slate-700 py-2 px-3 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchSales();
            }}
            className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
          >
            <div className="flex items-center gap-2 flex-1 max-w-sm relative">
              <input
                type="text"
                placeholder={t('sales.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1.5" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-6 px-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer ml-1"
            >
              <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
          </form>
        </div>

        {/* Desktop Spreadsheet Data Grid */}
        <div className="flex-1 min-h-[300px] flex flex-col border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col" onScroll={handleTableScroll}>
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                <tr>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">{t('common.sn')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">{t('dashboard.refNumber')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">{t('common.date')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-40">{t('dashboard.createdBy')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[150px]">{t('dashboard.customer')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">{t('sales.itemsCount')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-right">{t('sales.totalAmount')}</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">{t('common.status')}</th>
                  <th className="px-3 py-1.5 w-32 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {loading && page === 1 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>Loading sales...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-rose-600 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-neutral-400" />
                        <span>No sales found matching criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {sales.map((sale, idx) => {
                      const isSelected = highlightedSale?.id === sale.id;
                      return (
                      <tr
                        key={sale.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setHighlightedSale(sale)}
                        onDoubleClick={() => setSelectedSale(sale)}
                        title="Double-click to view details"
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono font-bold ${isSelected ? 'text-white' : 'text-neutral-800 dark:text-neutral-100'}`}>{sale.referenceNumber}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>{formatDate(sale.createdAt)}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{sale.createdBy?.name || '—'}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {sale.customerName ? (
                            <div className="flex flex-col">
                              <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{sale.customerName}</span>
                              {sale.customerPhone && <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{sale.customerPhone}</span>}
                            </div>
                          ) : 'Walk-in Customer'}
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>{sale.items?.length || 0}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono font-bold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                          ৳ {Number(sale.totalAmount).toFixed(2)}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            sale.status === 'COMPLETED'
                              ? (isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800')
                              : (isSelected ? 'bg-rose-600 text-white border-rose-500' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800')
                          }`}>
                            {sale.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setMemoSale(sale); setMemoOpen(true); }}
                              className={`h-6 px-2 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer border ${
                                isSelected
                                  ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                  : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-400 hover:bg-neutral-100'
                              }`}
                            >
                              <Printer className="w-3 h-3" /> Memo
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                    {loadingMore && (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-neutral-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            <span>Loading more sales...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Grey backdrop filling remaining space */}
          <div className="flex-1 min-h-[60px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
          
          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-emerald-900 dark:text-emerald-300">
                {t('common.loaded')} <strong>{sales.length}</strong> {t('common.of')} <strong>{meta.total}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-300">
                Page: <strong>{page} / {meta.totalPages || 1}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {highlightedSale ? (
                <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                  {t('common.selected')}: {highlightedSale.referenceNumber}
                </span>
              ) : (
                <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                  {t('sales.tip')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sale Details Modal (ERP Style) */}
      <Dialog
        open={!!selectedSale}
        onOpenChange={(open) => { if (!open) setSelectedSale(null); }}
        draggable={true}
        closeOnBackdropClick={true}
        className="p-0 max-w-3xl w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <div
          data-drag-handle
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none">{t('sales.saleDetails')}</h2>
          <button
            type="button"
            onClick={() => setSelectedSale(null)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedSale && (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm">
                <h3 className="font-bold text-neutral-500 uppercase tracking-wide border-b pb-1 mb-2">General Info</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Reference Number:</span><span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{selectedSale.referenceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Date:</span><span className="font-bold text-neutral-900 dark:text-neutral-100">{formatDate(selectedSale.createdAt)}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Created By:</span><span className="text-neutral-900 dark:text-neutral-100">{selectedSale.createdBy?.name || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Status:</span>
                    <span className={`font-bold uppercase ${
                      selectedSale.status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {selectedSale.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm">
                <h3 className="font-bold text-neutral-500 uppercase tracking-wide border-b pb-1 mb-2">Customer Info</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Name:</span><span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedSale.customerName || 'Walk-in Customer'}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Phone:</span><span className="text-neutral-900 dark:text-neutral-100">{selectedSale.customerPhone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Total Lines:</span><span className="font-bold text-neutral-900 dark:text-neutral-100">{selectedSale.items?.length || 0} Items</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Grand Total:</span><span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">৳ {Number(selectedSale.totalAmount).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm">
              <h3 className="font-bold text-neutral-500 uppercase tracking-wide border-b pb-2 mb-3">Items in Sale</h3>
              <div className="border border-neutral-300 dark:border-slate-700 overflow-x-auto">
                <table className="w-full text-xs min-w-[380px]">
                  <thead className="bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-300 dark:border-slate-700">
                    <tr className="text-left font-bold text-neutral-700 dark:text-neutral-300">
                      <th className="p-2 border-r border-neutral-300 dark:border-slate-700 w-10 text-center">SN</th>
                      <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Product</th>
                      <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Quantity</th>
                      <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-32">Unit Price</th>
                      <th className="p-2 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-700">
                    {selectedSale.items?.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 border-r border-neutral-200 dark:border-slate-700 text-center text-neutral-500">{idx + 1}</td>
                        <td className="p-2 border-r border-neutral-200 dark:border-slate-700">
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 block">{item.product?.name}</span>
                          <span className="text-[10px] text-neutral-500 block font-mono">{item.product?.sku}</span>
                        </td>
                        <td className="p-2 border-r border-neutral-200 dark:border-slate-700 text-center font-bold text-neutral-900 dark:text-neutral-100">{item.quantity}</td>
                        <td className="p-2 border-r border-neutral-200 dark:border-slate-700 text-right text-neutral-600 dark:text-neutral-400">
                          ৳ {Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-2 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                          ৳ {Number(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#eaf1f8] dark:bg-slate-800 border-t border-neutral-300 dark:border-slate-700 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2 text-right border-r border-neutral-300 dark:border-slate-700 uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                        Grand Total:
                      </td>
                      <td className="p-2 text-right text-sm text-neutral-900 dark:text-neutral-100">
                        ৳ {Number(selectedSale.totalAmount).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedSale.note && (
              <div className="bg-white dark:bg-slate-800 p-2 border border-neutral-400 dark:border-slate-600 shadow-sm text-neutral-800 dark:text-neutral-200">
                <strong>Sale Note:</strong> {selectedSale.note}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMemoSale(selectedSale);
                  setMemoOpen(true);
                }}
                className="w-auto px-4 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-xs tracking-wider shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice Memo
              </button>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="w-24 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => toast.info('Sale editing is restricted in this version. Please cancel and recreate the sale.')}
                className="h-7 px-4 bg-white dark:bg-slate-700 text-[#006400] dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <InvoiceMemoModal
        sale={memoSale}
        open={memoOpen}
        onOpenChange={setMemoOpen}
      />

      <SaleManualModal
        open={saleManualModalOpen}
        onOpenChange={setSaleManualModalOpen}
        onSaveSuccess={fetchSales}
      />

      <SaleBarcodeModal
        open={saleBarcodeModalOpen}
        onOpenChange={setSaleBarcodeModalOpen}
        onSaveSuccess={fetchSales}
      />
    </div>
  );
}
