'use client';
import { toast } from "sonner";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, Category, Company, Warehouse } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Package, Plus, Search, Edit2, AlertCircle, ChevronLeft, ChevronRight, Building2, HelpCircle, X, Loader2, Check, ShoppingCart, Tag } from 'lucide-react';
import { PurchaseModal } from '@/components/purchases/purchase-modal';
import { SaleRateModal } from '@/components/products/sale-rate-modal';

export default function ProductsPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseModalCode, setPurchaseModalCode] = useState<string | undefined>(undefined);
  const [saleRateModalOpen, setSaleRateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showTableProducts, setShowTableProducts] = useState(false);
  const [codeExistsWarning, setCodeExistsWarning] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeIsAvailable, setCodeIsAvailable] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    companyId: '',
    warehouseId: '',
    unit: 'Pieces',
    dpRate: 0,
    costPrice: 0,
    sellingPrice: 0,
    quantity: '' as number | string,
    reorderLevel: 10,
    description: 'None',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchMetadata = async () => {
    try {
      const [catRes, compRes, whRes] = await Promise.all([
        api.get<Category[]>('/categories'),
        api.get<Company[]>('/companies'),
        api.get<Warehouse[]>('/warehouses'),
      ]);
      setCategories(catRes.data);
      setCompanies(compRes.data);
      if (whRes.data && whRes.data.length > 0) {
        const activeWhs = whRes.data.filter((w) => w.isActive !== false);
        setWarehouses(activeWhs.length > 0 ? activeWhs : whRes.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Product[]>('/products', {
        page,
        limit,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        stockStatus: stockFilter !== 'ALL' ? stockFilter : undefined,
      });
      setProducts(res.data);
      if (res.meta) {
        setMeta(res.meta);
      }
      return res.data;
    } catch (err: any) {
      setError(err.message || 'Failed to load products.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedSearch, categoryFilter, stockFilter]);

  // Check if Item Code already exists in database (Immediate or onBlur)
  const checkCodeAvailability = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || code.length < 2) {
      setCodeExistsWarning(null);
      setIsCheckingCode(false);
      setCodeIsAvailable(false);
      return;
    }

    if (editingProduct && editingProduct.sku.toUpperCase() === code) {
      setCodeExistsWarning(null);
      setIsCheckingCode(false);
      setCodeIsAvailable(false);
      return;
    }

    setIsCheckingCode(true);
    try {
      const res = await api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`);
      if (res.data && (!editingProduct || res.data.id !== editingProduct.id)) {
        setCodeExistsWarning(`Item code "${code}" already exists (${res.data.name})`);
        setCodeIsAvailable(false);
      } else {
        setCodeExistsWarning(null);
        setCodeIsAvailable(true);
      }
    } catch {
      // 404 means code does not exist in DB (available!)
      setCodeExistsWarning(null);
      setCodeIsAvailable(true);
    } finally {
      setIsCheckingCode(false);
    }
  };

  // Debounced Item Code verification while typing (500ms)
  useEffect(() => {
    if (!modalOpen) {
      setCodeExistsWarning(null);
      setIsCheckingCode(false);
      setCodeIsAvailable(false);
      return;
    }

    const code = form.sku.trim().toUpperCase();
    if (!code || code.length < 2) {
      setCodeExistsWarning(null);
      setIsCheckingCode(false);
      setCodeIsAvailable(false);
      return;
    }

    if (editingProduct && editingProduct.sku.toUpperCase() === code) {
      setCodeExistsWarning(null);
      setIsCheckingCode(false);
      setCodeIsAvailable(false);
      return;
    }

    let active = true;
    setIsCheckingCode(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`);
        if (!active) return;
        if (res.data && (!editingProduct || res.data.id !== editingProduct.id)) {
          setCodeExistsWarning(`Item code "${code}" already exists (${res.data.name})`);
          setCodeIsAvailable(false);
        } else {
          setCodeExistsWarning(null);
          setCodeIsAvailable(true);
        }
      } catch {
        if (!active) return;
        setCodeExistsWarning(null);
        setCodeIsAvailable(true);
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.sku, editingProduct, modalOpen]);

  // Modal Infinite Scroll State
  const [modalProductsList, setModalProductsList] = useState<Product[]>([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [modalLoadingMore, setModalLoadingMore] = useState(false);

  const fetchInitialModalProducts = async (priorityItem?: Product) => {
    try {
      setModalLoadingMore(true);
      const res = await api.get<Product[]>('/products', {
        page: 1,
        limit: 20,
      });
      let list = res.data;
      if (priorityItem) {
        const others = list.filter((p) => p.id !== priorityItem.id);
        list = [priorityItem, ...others];
      }
      setModalProductsList(list);
      setModalPage(1);
      if (res.meta) {
        setModalHasMore(1 < res.meta.totalPages);
      } else {
        setModalHasMore(false);
      }
    } catch {
      // ignore
    } finally {
      setModalLoadingMore(false);
    }
  };

  const fetchNextModalPage = async () => {
    if (modalLoadingMore || !modalHasMore) return;
    try {
      setModalLoadingMore(true);
      const nextPage = modalPage + 1;
      const res = await api.get<Product[]>('/products', {
        page: nextPage,
        limit: 20,
      });
      if (res.data.length > 0) {
        setModalProductsList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = res.data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        setModalPage(nextPage);
      }
      if (res.meta) {
        setModalHasMore(nextPage < res.meta.totalPages);
      } else {
        setModalHasMore(false);
      }
    } catch {
      // ignore
    } finally {
      setModalLoadingMore(false);
    }
  };

  const handleModalTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!showTableProducts || modalLoadingMore || !modalHasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      fetchNextModalPage();
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setShowTableProducts(false);
    setModalProductsList([]);
    setModalPage(1);
    setModalHasMore(true);
    setCodeExistsWarning(null);
    setIsCheckingCode(false);
    setCodeIsAvailable(false);
    setForm({
      name: '',
      sku: '',
      categoryId: '',
      companyId: companies[0]?.id || '',
      warehouseId: '',
      unit: 'Pieces',
      dpRate: 0,
      costPrice: 0,
      sellingPrice: 0,
      quantity: '0',
      reorderLevel: 10,
      description: 'None',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setShowTableProducts(true);
    setCodeExistsWarning(null);
    setIsCheckingCode(false);
    setCodeIsAvailable(false);
    setForm({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId || '',
      companyId: p.companyId || '',
      warehouseId: '',
      unit: p.unit || 'Pieces',
      dpRate: p.dpRate ? Number(p.dpRate) : 0,
      costPrice: p.costPrice ?? 0,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      description: p.description || 'None',
      isActive: p.isActive,
    });
    setModalOpen(true);
    fetchInitialModalProducts(p);
  };

  const handleSelectProductInModal = (p: Product) => {
    setEditingProduct(p);
    setCodeExistsWarning(null);
    setIsCheckingCode(false);
    setCodeIsAvailable(false);
    setForm({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId || '',
      companyId: p.companyId || '',
      warehouseId: '',
      unit: p.unit || 'Pieces',
      dpRate: p.dpRate ? Number(p.dpRate) : 0,
      costPrice: p.costPrice ?? 0,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      description: p.description || 'None',
      isActive: p.isActive,
    });
  };

  const handleRefreshModal = () => {
    setEditingProduct(null);
    setCodeExistsWarning(null);
    setIsCheckingCode(false);
    setCodeIsAvailable(false);
    setForm({
      name: '',
      sku: '',
      categoryId: '',
      companyId: companies[0]?.id || '',
      warehouseId: '',
      unit: 'Pieces',
      dpRate: 0,
      costPrice: 0,
      sellingPrice: 0,
      quantity: '0',
      reorderLevel: 10,
      description: 'None',
      isActive: true,
    });
  };

  const displayModalProducts = React.useMemo(() => {
    if (!showTableProducts) return [];
    if (!editingProduct) return modalProductsList;
    const others = modalProductsList.filter((p) => p.id !== editingProduct.id);
    const selectedInList = modalProductsList.find((p) => p.id === editingProduct.id) || editingProduct;
    return [selectedInList, ...others];
  }, [showTableProducts, editingProduct, modalProductsList]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error('Item Code and Item Name are required.');
      return;
    }
    if (codeExistsWarning) {
      toast.error(`Cannot save: ${codeExistsWarning}. Please specify a unique Item Code.`);
      return;
    }
    setShowConfirmSave(true);
  };

  const executeSaveProduct = async () => {
    setIsSaving(true);
    try {
      let savedProduct: Product;
      if (editingProduct) {
        const res = await api.patch<Product>(`/products/${editingProduct.id}`, {
          name: form.name,
          sku: form.sku,
          categoryId: form.categoryId || undefined,
          companyId: form.companyId || undefined,
          unit: form.unit,
          dpRate: Number(form.dpRate),
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          reorderLevel: Number(form.reorderLevel),
          description: form.description,
          isActive: form.isActive,
        });
        savedProduct = res.data;
      } else {
        const res = await api.post<Product>('/products', {
          ...form,
          categoryId: form.categoryId || undefined,
          companyId: form.companyId || undefined,
          warehouseId: undefined,
          dpRate: Number(form.dpRate) || 0,
          costPrice: Number(form.costPrice) || 0,
          sellingPrice: Number(form.sellingPrice) || 0,
          quantity: 0,
          reorderLevel: Number(form.reorderLevel) || 10,
        });
        savedProduct = res.data;
      }
      if (!savedProduct.company && savedProduct.companyId) {
        const comp = companies.find((c) => c.id === savedProduct.companyId);
        if (comp) savedProduct.company = comp;
      }
      setEditingProduct(savedProduct);
      setShowTableProducts(true);
      setShowConfirmSave(false);
      await fetchInitialModalProducts(savedProduct);
      fetchProducts();
      toast.success('Product saved successfully to catalog!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct) {
      toast.error('Please select a product from the list below to delete.');
      return;
    }
    if (!confirm(`Are you sure you want to delete product "${editingProduct.name}" (${editingProduct.sku})?`)) {
      return;
    }
    try {
      setIsSaving(true);
      await api.delete(`/products/${editingProduct.id}`);
      setEditingProduct(null);
      handleOpenCreate();
      await fetchProducts();
      toast.success('Product deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product.');
    } finally {
      setIsSaving(false);
    }
  };

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      {/* Desktop Main Window Frame */}
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              {t('products.title')}
              <span className="hidden sm:inline text-[11px] font-normal text-emerald-200 tracking-normal border border-emerald-500/40 px-1.5 py-0.5 rounded-xs bg-emerald-900/30">
                PRODUCT CATALOG & INVENTORY
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-3 py-1 text-xs font-bold bg-white text-[#006400] hover:bg-emerald-50 border border-white shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
                  title="Add a new product to catalog"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPurchaseModalCode(undefined); setPurchaseModalOpen(true); }}
                  className="px-2.5 py-1 text-xs font-bold bg-[#800000] hover:bg-rose-900 text-white border border-rose-800/60 shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
                  title="Open purchase invoice modal"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-rose-200" />
                  <span>Purchase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSaleRateModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold bg-[#004d00] hover:bg-emerald-900 text-white border border-emerald-600/60 shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
                  title="Manage product sale rates"
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Sale Rate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Master Content Section */}
        <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 space-y-2 text-xs text-neutral-900 dark:text-neutral-100">

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-[#dbe7f3] dark:bg-slate-800/60 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner shrink-0">
            {/* Search Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs shrink-0">Filter:</span>
              <div className="relative flex-1 sm:w-72">
                <input
                  type="text"
                  placeholder={t('products.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1.5" />
              </div>
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-xs text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 underline cursor-pointer">
                  Clear
                </button>
              )}
            </div>

            {/* Filter dropdowns & actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="h-6 px-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
                >
                  <option value="">{t('products.allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Stock:</span>
                <select
                  value={stockFilter}
                  onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
                  className="h-6 px-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
                >
                  <option value="ALL">{t('products.allStockStatuses')}</option>
                  <option value="IN_STOCK">{t('products.inStock')}</option>
                  <option value="LOW_STOCK">{t('products.lowStock')}</option>
                  <option value="OUT_OF_STOCK">{t('products.outOfStock')}</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={fetchProducts}
                  disabled={loading}
                  className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Reload product list"
                >
                  <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 ml-1">
                  Total: <strong>{meta.total}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Spreadsheet Data Grid */}
          <div className="flex-1 min-h-[300px] flex flex-col border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                  <tr>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28">{t('products.sku')}</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">{t('products.name')}</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">{t('products.category')}</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">{t('products.unit')}</th>
                    {canManage && <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">{t('products.costPrice')}</th>}
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">{t('products.sellingPrice')}</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">{t('products.availableStock')}</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">{t('products.status')}</th>
                    {canManage && <th className="px-3 py-1.5 w-20 text-center">{t('products.action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={canManage ? 10 : 8} className="py-16 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>{t('products.loading')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={canManage ? 10 : 8} className="py-12 text-center text-rose-600 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 10 : 8} className="py-16 text-center text-neutral-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="w-8 h-8 text-neutral-400" />
                          <span>{t('products.noProducts')}</span>
                          {canManage && (
                            <button
                              type="button"
                              onClick={handleOpenCreate}
                              className="mt-2 px-3 py-1 bg-[#006400] text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add First Product</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={`transition-colors cursor-pointer ${
                          idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80'
                        }`}
                        onDoubleClick={() => canManage && handleOpenEdit(p)}
                        title={canManage ? 'Double-click to edit' : ''}
                      >
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono text-neutral-500">{(page - 1) * limit + idx + 1}</td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono font-bold text-neutral-800 dark:text-neutral-100">{p.sku}</td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                          {p.name}
                          {p.description && p.description !== 'None' && (
                            <div className="text-[10px] text-neutral-500 font-normal truncate max-w-xs">{p.description}</div>
                          )}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-neutral-600 dark:text-neutral-400">{p.category?.name || '—'}</td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center text-neutral-600 dark:text-neutral-400">{p.unit}</td>
                        {canManage && (
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono text-neutral-600 dark:text-neutral-400">
                            {p.costPrice !== undefined ? formatMoney(p.costPrice) : '—'}
                          </td>
                        )}
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {formatMoney(p.sellingPrice)}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span className={`font-bold text-sm ${
                            p.quantity <= 0 ? 'text-rose-600' : p.quantity <= p.reorderLevel ? 'text-amber-600' : 'text-neutral-900 dark:text-neutral-100'
                          }`}>
                            {p.quantity}
                          </span>
                          <span className="text-[10px] text-neutral-400 ml-1">{p.unit}</span>
                          {p.warehouseStocks && p.warehouseStocks.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center mt-0.5">
                              {p.warehouseStocks.filter((ws) => ws.quantity > 0).map((ws) => (
                                <span
                                  key={ws.id}
                                  className="text-[9px] px-1 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xs"
                                  title={`${ws.warehouse?.name || 'Warehouse'}: ${ws.quantity} ${p.unit}`}
                                >
                                  {ws.warehouse?.name?.split(' ')[0] || 'WH'}: <strong>{ws.quantity}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            p.stockStatus === 'IN_STOCK'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : p.stockStatus === 'LOW_STOCK'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                          }`}>
                            {p.stockStatus === 'IN_STOCK' ? t('products.inStock') : p.stockStatus === 'LOW_STOCK' ? t('products.lowStock') : t('products.outOfStock')}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(p); }}
                              className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer mx-auto"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{t('products.edit')}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && products.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-t border-neutral-300 dark:border-slate-700 bg-[#eaf1f8] dark:bg-slate-800 text-xs shrink-0">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <span>
                    Showing <strong className="text-neutral-900 dark:text-neutral-100">{(page - 1) * limit + 1}</strong> to <strong className="text-neutral-900 dark:text-neutral-100">{Math.min(page * limit, meta.total)}</strong> of <strong className="text-neutral-900 dark:text-neutral-100">{meta.total}</strong>
                  </span>
                  <span className="hidden sm:inline text-neutral-400">•</span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span>Per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                      className="h-6 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 rounded-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Page <strong className="text-neutral-900 dark:text-neutral-100">{page}</strong> / <strong className="text-neutral-900 dark:text-neutral-100">{meta.totalPages || 1}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-6 w-6 flex items-center justify-center bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-xs hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= (meta.totalPages || 1)}
                    onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
                    className="h-6 w-6 flex items-center justify-center bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-xs hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Add / Edit Dialog (Exact design matching reference video & screenshot) */}
      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-4xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Close Cross Button and Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none">Item Add</h2>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            disabled={isSaving}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-3 sm:p-5 space-y-4">
          {/* Upper Section: Form Inputs (Left) and Action Buttons Stack (Right) */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
            {/* Form Fields */}
            <div className="space-y-1.5 flex-1 w-full max-w-xl text-xs">
              {/* Item Code */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => {
                        setForm({ ...form, sku: e.target.value.toUpperCase() });
                        setCodeIsAvailable(false);
                      }}
                      onBlur={() => {
                        checkCodeAvailability(form.sku);
                      }}
                      placeholder="e.g. 937095"
                      className={`w-40 sm:w-48 h-6 px-2 pr-7 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border font-mono font-bold focus:outline-none focus:ring-1 ${
                        codeExistsWarning
                          ? 'border-red-500 text-red-600 focus:ring-red-500 bg-red-50/50 dark:bg-red-950/30'
                          : codeIsAvailable && form.sku.trim().length >= 2
                          ? 'border-emerald-500 focus:ring-emerald-500'
                          : 'border-neutral-400 dark:border-slate-600 focus:ring-emerald-600'
                      }`}
                      required
                    />
                    <div className="absolute right-1.5 flex items-center pointer-events-none">
                      {isCheckingCode && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                      )}
                      {!isCheckingCode && codeExistsWarning && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      {!isCheckingCode && codeIsAvailable && form.sku.trim().length >= 2 && (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Immediate warning message if item code already exists */}
                {codeExistsWarning && (
                  <div className="flex items-center gap-1.5 ml-[108px] text-[11px] text-red-600 dark:text-red-400 font-bold animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{codeExistsWarning}</span>
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="baby reading table"
                  className="w-full max-w-sm h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* Company */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Company
                </label>
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="w-40 sm:w-48 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Type
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-40 sm:w-48 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="Pieces">Pieces</option>
                  <option value="Dozens">Dozens</option>
                  <option value="Sets">Sets</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Kilograms">Kilograms</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Packets">Packets</option>
                  <option value="Pairs">Pairs</option>
                </select>
              </div>

              {/* Category (Optional) */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-40 sm:w-48 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="">-- Optional / None --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0 pt-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="None"
                  rows={3}
                  className="w-full max-w-sm h-16 px-2 py-1 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Vertical Stack of Action Buttons */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto items-center md:items-end justify-start pt-1">
              <button
                type="button"
                onClick={handleRefreshModal}
                disabled={isSaving}
                className="w-28 sm:w-32 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSaving}
                className="w-28 sm:w-32 h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b81b4c] dark:text-rose-400" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save'
                )}
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isSaving || !editingProduct}
                className="w-28 sm:w-32 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-[#0056b3] dark:text-blue-400 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={isSaving}
                className="w-28 sm:w-32 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>

          {/* Lower Section: Items Table Grid matching screenshot with Infinite Scroll */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner">
            <div
              onScroll={handleModalTableScroll}
              className="max-h-56 sm:max-h-60 overflow-y-auto min-h-[160px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-12 text-center font-bold">SN</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-28 font-bold">Code</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-44 sm:w-56 font-bold">Name</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-32 font-bold">Company</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-bold">Type</th>
                    <th className="py-1 px-2 font-bold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {displayModalProducts.map((p, idx) => {
                    const isSelected = editingProduct?.id === p.id;
                    const isCyan = idx % 2 === 1;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelectProductInModal(p)}
                        className={`cursor-pointer transition-colors select-none ${
                          isSelected
                            ? 'bg-[#0078d7] text-white font-medium'
                            : isCyan
                            ? 'bg-[#e0f7fa] dark:bg-cyan-950/40 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800/80'
                            : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <td className={`py-0.5 px-2 border-r ${isSelected ? 'border-blue-400/40' : 'border-neutral-300 dark:border-slate-700'} text-center w-12`}>
                          {idx + 1}
                        </td>
                        <td className={`py-0.5 px-2 border-r ${isSelected ? 'border-blue-400/40' : 'border-neutral-300 dark:border-slate-700'} font-mono font-semibold w-28`}>
                          {p.sku}
                        </td>
                        <td className={`py-0.5 px-2 border-r ${isSelected ? 'border-blue-400/40' : 'border-neutral-300 dark:border-slate-700'} w-44 sm:w-56 truncate`}>
                          {p.name}
                        </td>
                        <td className={`py-0.5 px-2 border-r ${isSelected ? 'border-blue-400/40' : 'border-neutral-300 dark:border-slate-700'} w-32 truncate ${isSelected ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {p.company?.name || companies.find((c) => c.id === p.companyId)?.name || '—'}
                        </td>
                        <td className={`py-0.5 px-2 border-r ${isSelected ? 'border-blue-400/40' : 'border-neutral-300 dark:border-slate-700'} w-24`}>
                          {p.unit}
                        </td>
                        <td className={`py-0.5 px-2 truncate ${isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {p.description || 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Loading More Indicator during Infinite Scroll */}
              {modalLoadingMore && (
                <div className="py-2 bg-neutral-100 dark:bg-slate-800 text-center text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-1.5 border-t border-neutral-300 dark:border-slate-700 select-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Loading more products...</span>
                </div>
              )}

              {/* All Products Loaded Indicator */}
              {!modalHasMore && displayModalProducts.length > 20 && (
                <div className="py-1 bg-neutral-100/90 dark:bg-slate-800/90 text-center text-[11px] text-neutral-500 border-t border-neutral-300 dark:border-slate-700 select-none">
                  All {displayModalProducts.length} products loaded
                </div>
              )}

              {/* Grey backdrop filling remaining space */}
              <div className="flex-1 min-h-[60px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Save Confirmation Dialog (Exact workflow from video) */}
      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={(open) => { if (!isSaving) setShowConfirmSave(open); }}
        title="Confirm Save"
        description="Do you want to save the information?"
        onConfirm={executeSaveProduct}
        confirmText="Yes"
        cancelText="No"
        variant="success"
        isLoading={isSaving}
        loadingText="Saving..."
      />

      {/* Purchase Dialog */}
      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        initialProductCode={purchaseModalCode}
        onSaveSuccess={fetchProducts}
      />

      {/* Sale Rate Dialog */}
      <SaleRateModal
        open={saleRateModalOpen}
        onOpenChange={setSaleRateModalOpen}
        onSaveSuccess={fetchProducts}
      />
    </div>
  );
}

