'use client';
import { toast } from "sonner";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, Category, Company, Warehouse } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> {t('products.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('products.subtitle')}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="w-4 h-4" /> {t('products.addProduct')}
            </Button>
            <Button
              onClick={() => {
                setPurchaseModalCode(undefined);
                setPurchaseModalOpen(true);
              }}
              variant="outline"
              className="gap-2 border-[#800000] text-[#800000] hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40 font-semibold"
            >
              <ShoppingCart className="w-4 h-4" /> Purchase
            </Button>
            <Button
              onClick={() => setSaleRateModalOpen(true)}
              variant="outline"
              className="gap-2 border-[#006400] text-[#006400] hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950/40 font-semibold"
            >
              <Tag className="w-4 h-4" /> Sale Rate
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9"
            >
              <option value="">{t('products.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9"
            >
              <option value="ALL">{t('products.allStockStatuses')}</option>
              <option value="IN_STOCK">{t('products.inStock')}</option>
              <option value="LOW_STOCK">{t('products.lowStock')}</option>
              <option value="OUT_OF_STOCK">{t('products.outOfStock')}</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('products.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('products.noProducts')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[750px]">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('products.sku')}</th>
                    <th className="p-3">{t('products.name')}</th>
                    <th className="p-3">{t('products.category')}</th>
                    <th className="p-3">{t('products.unit')}</th>
                    {canManage && <th className="p-3 text-right">{t('products.costPrice')}</th>}
                    <th className="p-3 text-right">{t('products.sellingPrice')}</th>
                    <th className="p-3 text-center">{t('products.availableStock')}</th>
                    <th className="p-3">{t('products.status')}</th>
                    {canManage && <th className="p-3 text-right">{t('products.action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="p-3 font-mono font-medium text-foreground">{p.sku}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {p.name}
                        {p.description && (
                          <p className="text-[10px] text-muted-foreground font-normal truncate max-w-xs">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.category?.name || '—'}</td>
                      <td className="p-3 text-muted-foreground">{p.unit}</td>
                      {canManage && (
                        <td className="p-3 text-right font-medium text-muted-foreground">
                          {p.costPrice !== undefined ? formatMoney(p.costPrice) : '—'}
                        </td>
                      )}
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatMoney(p.sellingPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-bold text-sm ${
                            p.quantity <= 0
                              ? 'text-destructive'
                              : p.quantity <= p.reorderLevel
                              ? 'text-amber-600'
                              : 'text-foreground'
                          }`}
                        >
                          {p.quantity}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">{p.unit}</span>
                        {p.warehouseStocks && p.warehouseStocks.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center mt-1">
                            {p.warehouseStocks
                              .filter((ws) => ws.quantity > 0)
                              .map((ws) => (
                                <span
                                  key={ws.id}
                                  className="text-[9px] px-1 py-0.5 rounded bg-muted/80 text-foreground border border-border shrink-0"
                                  title={`${ws.warehouse?.name || 'Warehouse'}: ${ws.quantity} ${p.unit}`}
                                >
                                  {ws.warehouse?.name?.split(' ')[0] || 'WH'}: <strong>{ws.quantity}</strong>
                                </span>
                              ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            p.stockStatus === 'IN_STOCK'
                              ? 'success'
                              : p.stockStatus === 'LOW_STOCK'
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {p.stockStatus === 'IN_STOCK'
                            ? t('products.inStock')
                            : p.stockStatus === 'LOW_STOCK'
                            ? t('products.lowStock')
                            : t('products.outOfStock')}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" /> {t('products.edit')}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && products.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>
                    Showing{' '}
                    <span className="font-semibold text-foreground">
                      {(page - 1) * limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-foreground">
                      {Math.min(page * limit, meta.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-foreground">
                      {meta.total}
                    </span>{' '}
                    products
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">Per page:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      aria-label="Products per page"
                      className="h-7 px-2 text-xs rounded border border-input bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                    <span className="font-semibold text-foreground">{meta.totalPages || 1}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page >= (meta.totalPages || 1)}
                      onClick={() => setPage((p) => Math.min(meta.totalPages || 1, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

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

