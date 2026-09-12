'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog } from '@/components/ui/dialog';
import {
  Search,
  X,
  Loader2,
  Package,
  Building2,
  RotateCcw,
  ArrowRight,
  Barcode,
} from 'lucide-react';
import { Product, Category, Company } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface ProductLookupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: Product) => void;
  title?: string;
  initialSearch?: string;
  warehouseId?: string;
}

export function ProductLookupModal({
  open,
  onOpenChange,
  onSelectProduct,
  title = 'Select Product',
  initialSearch = '',
  warehouseId,
}: ProductLookupModalProps) {
  // Search & Filter States
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [stockStatus, setStockStatus] = useState<string>('ALL');

  // Metadata dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Products & Infinite Scrolling
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const limit = 25;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Refs for scrolling & intersection observer
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (open) {
      if (initialSearch) {
        setSearch(initialSearch);
        setDebouncedSearch(initialSearch);
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
      loadMetadata();
    } else {
      setSearch('');
      setDebouncedSearch('');
      setCategoryId('');
      setCompanyId('');
      setStockStatus('ALL');
      setProducts([]);
      setPage(1);
    }
  }, [open, initialSearch]);

  const loadMetadata = async () => {
    try {
      const [catRes, compRes] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<Company[]>('/companies'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (compRes.data) setCompanies(compRes.data);
    } catch {
      // Non-blocking
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products function
  const fetchProducts = useCallback(
    async (pageNum: number, isReset: boolean) => {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params: Record<string, any> = {
          page: pageNum,
          limit,
          search: debouncedSearch.trim() || undefined,
          categoryId: categoryId || undefined,
          companyId: companyId || undefined,
          stockStatus: stockStatus !== 'ALL' ? stockStatus : undefined,
          isActive: 'true',
        };

        const res = await api.get<Product[]>('/products', params);
        const newItems = res.data || [];
        const meta = res.meta || { total: newItems.length, totalPages: 1 };

        setTotalCount(meta.total);
        setTotalPages(meta.totalPages);

        if (isReset) {
          setProducts(newItems);
        } else {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const filteredNew = newItems.filter((p) => !existingIds.has(p.id));
            return [...prev, ...filteredNew];
          });
        }
      } catch (err) {
        console.error('Failed to fetch products for lookup:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, categoryId, companyId, stockStatus]
  );

  // Trigger reset fetch when search/filters change
  useEffect(() => {
    if (!open) return;
    setPage(1);
    fetchProducts(1, true);
  }, [debouncedSearch, categoryId, companyId, stockStatus, open, fetchProducts]);

  // Infinite Scroll: Intersection Observer + onScroll handler
  const loadNextPage = useCallback(() => {
    if (loading || loadingMore) return;
    if (page < totalPages) {
      const next = page + 1;
      setPage(next);
      fetchProducts(next, false);
    }
  }, [loading, loadingMore, page, totalPages, fetchProducts]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '120px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  // Secondary scroll listener for ultra-reliable detection
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || loading || loadingMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      loadNextPage();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryId('');
    setCompanyId('');
    setStockStatus('ALL');
    setPage(1);
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={true}
      className="p-0 max-w-5xl w-full border-2 border-emerald-800 dark:border-emerald-700 rounded-none bg-white dark:bg-slate-900 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
    >
      {/* Top Banner with Drag Handle */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="bg-emerald-800 dark:bg-emerald-950 py-2 px-4 select-none border-b border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none text-white shrink-0"
      >
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-300" />
          <span className="font-bold text-sm tracking-wide">{title}</span>
          <span className="text-xs bg-emerald-900/80 px-2 py-0.5 rounded-full text-emerald-200 border border-emerald-700 font-mono">
            {totalCount} Items
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-6 h-6 flex items-center justify-center bg-emerald-900/60 hover:bg-red-600 rounded text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-neutral-100 dark:bg-slate-800/90 border-b border-neutral-300 dark:border-slate-700 space-y-2 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Main Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Code (SKU), or Barcode..."
              className="w-full h-8 pl-8 pr-7 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium placeholder:text-neutral-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">All Companies</option>
              {companies.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-300 dark:border-slate-600 rounded-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            >
              <option value="ALL">All Stock</option>
              <option value="IN_STOCK">In Stock (&gt;0)</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="sm:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="h-8 w-full flex items-center justify-center gap-1 bg-white dark:bg-slate-900 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-600 rounded-sm text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Infinite Scrollable Table */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-[350px] max-h-[55vh] bg-white dark:bg-slate-950 select-text"
      >
        <table className="w-full text-left text-xs border-collapse border-b border-neutral-300 dark:border-slate-800">
          <thead className="sticky top-0 bg-[#e2e8f0] dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 font-bold border-b border-neutral-400 dark:border-slate-700 shadow-sm z-10 select-none">
            <tr>
              <th className="py-2 px-3 w-28 text-left border-r border-neutral-300 dark:border-slate-700">
                Item Code
              </th>
              <th className="py-2 px-3 text-left border-r border-neutral-300 dark:border-slate-700">
                Product Name
              </th>
              <th className="py-2 px-3 w-32 text-left border-r border-neutral-300 dark:border-slate-700 hidden sm:table-cell">
                Category
              </th>
              <th className="py-2 px-3 w-24 text-right border-r border-neutral-300 dark:border-slate-700">
                Stock
              </th>
              <th className="py-2 px-2 w-20 text-right border-r border-neutral-300 dark:border-slate-700 hidden md:table-cell">
                DP Rate
              </th>
              <th className="py-2 px-2 w-20 text-right border-r border-neutral-300 dark:border-slate-700 hidden md:table-cell">
                Purchase Cost
              </th>
              <th className="py-2 px-3 w-24 text-right border-r border-neutral-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-400">
                Sale Rate
              </th>
              <th className="py-2 px-3 w-24 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
            {products.map((p) => {
              const currentStock = warehouseId
                ? p.warehouseStocks?.find(
                    (ws) => ws.warehouseId === warehouseId || ws.warehouse?.id === warehouseId
                  )?.quantity || 0
                : p.quantity || 0;

              const isOutOfStock = currentStock <= 0;
              const isLowStock =
                !isOutOfStock &&
                p.reorderLevel !== undefined &&
                currentStock <= p.reorderLevel;

              return (
                <tr
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors group"
                >
                  {/* Item Code (SKU) + Barcode */}
                  <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    <div className="flex flex-col">
                      <span>{p.sku}</span>
                      {p.barcode && (
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal flex items-center gap-0.5">
                          <Barcode className="w-2.5 h-2.5 inline" />
                          {p.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Product Name & Company */}
                  <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {p.name}
                    </div>
                    {p.company?.name && (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5" />
                        {p.company.name}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-1.5 px-3 border-r border-neutral-200 dark:border-slate-800 hidden sm:table-cell text-neutral-600 dark:text-neutral-400 text-[11px]">
                    {p.category?.name || '—'}
                  </td>

                  {/* Stock Quantity & Badge */}
                  <td className="py-1.5 px-3 text-right border-r border-neutral-200 dark:border-slate-800 font-mono font-bold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        isOutOfStock
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                          : isLowStock
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {currentStock} {p.unit === 'Kilograms' || p.unit === 'Kilogram' ? 'KG' : (p.unit || '')}
                    </span>
                  </td>

                  {/* DP Rate */}
                  <td className="py-1.5 px-2 text-right border-r border-neutral-200 dark:border-slate-800 hidden md:table-cell font-mono text-neutral-600 dark:text-neutral-400">
                    ৳{Number(p.dpRate || 0).toFixed(2)}
                  </td>

                  {/* Purchase Cost */}
                  <td className="py-1.5 px-2 text-right border-r border-neutral-200 dark:border-slate-800 hidden md:table-cell font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                    ৳{Number(p.costPrice || 0).toFixed(2)}
                  </td>

                  {/* Sale Rate (Selling Price) */}
                  <td className="py-1.5 px-3 text-right border-r border-neutral-200 dark:border-slate-800 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{Number(p.sellingPrice || 0).toFixed(2)}
                  </td>

                  {/* Action Button */}
                  <td className="py-1.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(p);
                      }}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      Select
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-500 dark:text-neutral-400">
                  <Package className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-600 mb-2 opacity-60" />
                  <p className="font-medium text-sm">No products found</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Try adjusting your search query or filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 px-3 py-1 bg-neutral-200 dark:bg-slate-800 hover:bg-neutral-300 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Filters
                  </button>
                </td>
              </tr>
            )}

            {/* Initial Loading Skeletons */}
            {loading && (
              <>
                {[...Array(6)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="py-3 px-3">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-20" />
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-48 mb-1" />
                      <div className="h-2.5 bg-neutral-200 dark:bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-24" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-16 ml-auto" />
                    </td>
                    <td className="py-3 px-2 text-right hidden md:table-cell">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-14 ml-auto" />
                    </td>
                    <td className="py-3 px-2 text-right hidden md:table-cell">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-14 ml-auto" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="h-4 bg-neutral-200 dark:bg-slate-800 rounded w-16 ml-auto" />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="h-6 bg-neutral-200 dark:bg-slate-800 rounded w-16 mx-auto" />
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* Sentinel Element for Infinite Scrolling */}
        <div ref={sentinelRef} className="h-4 w-full" />

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="py-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-neutral-50 dark:bg-slate-900/60 border-t border-neutral-200 dark:border-slate-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more products...</span>
          </div>
        )}

        {/* All Products Loaded Notice */}
        {!loading && !loadingMore && products.length > 0 && page >= totalPages && (
          <div className="py-2.5 text-center text-[11px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-slate-900/40 border-t border-neutral-200 dark:border-slate-800">
            ✓ All {totalCount} products loaded
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div className="py-2 px-4 bg-neutral-100 dark:bg-slate-800/90 border-t border-neutral-300 dark:border-slate-700 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 shrink-0">
        <div>
          Showing{' '}
          <span className="font-bold text-neutral-900 dark:text-neutral-100">
            {products.length}
          </span>{' '}
          of{' '}
          <span className="font-bold text-neutral-900 dark:text-neutral-100">
            {totalCount}
          </span>{' '}
          products
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:inline">
            💡 Click any row or &quot;Select&quot; button to pick a product
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1 bg-white dark:bg-slate-700 hover:bg-neutral-200 dark:hover:bg-slate-600 text-neutral-800 dark:text-neutral-100 border border-neutral-300 dark:border-slate-600 rounded font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}

