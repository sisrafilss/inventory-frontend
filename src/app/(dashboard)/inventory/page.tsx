'use client';
import { toast } from 'sonner';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, StockMovement, StockMovementType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ProductCombobox } from '@/components/ui/product-combobox';
import {
  Boxes,
  PlusCircle,
  History,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Overview state & pagination
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // History state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState('');

  // Adjustment Modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustSelectedProduct, setAdjustSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Debounce search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.get<{ summary: any; products: any[]; meta: any }>(
        '/inventory/overview',
        {
          page,
          limit,
          search: debouncedSearch || undefined,
        },
      );
      setSummary(res.data.summary);
      setProducts(res.data.products);
      if (res.data.meta) {
        setMeta(res.data.meta);
      }
      if (res.data.products.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data.products[0].id);
        setAdjustSelectedProduct(res.data.products[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get<StockMovement[]>('/inventory/history', {
        type: historyFilterType || undefined,
      });
      setMovements(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyFilterType]);

  const selectedProduct =
    adjustSelectedProduct || products.find((p) => p.id === selectedProductId);

  // Live preview calculation for adjustment
  const calculatePreview = () => {
    if (!selectedProduct) return { before: 0, change: 0, after: 0 };
    const before = selectedProduct.quantity;
    let change = Math.abs(adjustQty || 0);

    if (adjustType === 'DAMAGE' || adjustType === 'LOSS') {
      change = -change;
    } else if (adjustType === 'CORRECTION' || adjustType === 'OTHER') {
      change = adjustQty || 0;
    }

    const after = before + change;
    return { before, change, after };
  };

  const preview = calculatePreview();

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !adjustReason.trim()) return;

    setIsAdjusting(true);
    try {
      await api.post('/inventory/adjustments', {
        productId: selectedProductId,
        type: adjustType,
        quantity: adjustQty,
        reason: adjustReason,
      });

      setAdjustOpen(false);
      setAdjustReason('');
      setAdjustQty(1);
      await fetchOverview();
      if (activeTab === 'history') {
        await fetchHistory();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const canAdjust = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="w-6 h-6 text-primary" /> {t('inventory.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('inventory.subtitle')}
          </p>
        </div>

        {canAdjust && (
          <Button onClick={() => setAdjustOpen(true)} className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" /> {t('inventory.adjustStock')}
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{t('inventory.totalQuantity')}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {summary.totalQuantity} <span className="text-xs font-normal text-muted-foreground">{t('inventory.units')}</span>
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{t('inventory.totalCostValuation')}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatMoney(summary.totalCostValue)}
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{t('inventory.totalRetailValuation')}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatMoney(summary.totalRetailValue)}
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{t('inventory.lowStockItems')}</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {summary.lowStockCount + summary.outOfStockCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">{t('inventory.items')}</span>
            </h3>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('inventory.currentStockValuation')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('inventory.stockMovementHistory')}
        </button>
      </div>

      {/* Tab 1: Current Stock Overview */}
      {activeTab === 'overview' && (
        <Card>
          <div className="p-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 bg-card">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search 10k+ items by name, SKU, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="text-xs text-muted-foreground self-start sm:self-center">
              Total {meta.total || products.length} catalog products
            </div>
          </div>
          <CardContent className="p-0">
            {loadingOverview ? (
              <div className="p-12 text-center text-xs text-muted-foreground">{t('inventory.loading')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[720px]">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('inventory.sku')}</th>
                      <th className="p-3">{t('inventory.product')}</th>
                      <th className="p-3">{t('inventory.category')}</th>
                      <th className="p-3 text-center">{t('inventory.inStock')}</th>
                      <th className="p-3 text-right">{t('inventory.unitCost')}</th>
                      <th className="p-3 text-right">{t('inventory.totalCostValue')}</th>
                      <th className="p-3">{t('inventory.status')}</th>
                      {canAdjust && <th className="p-3 text-right">{t('inventory.quickAction')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40">
                        <td className="p-3 font-mono font-medium">{p.sku}</td>
                        <td className="p-3 font-semibold text-foreground">{p.name}</td>
                        <td className="p-3 text-muted-foreground">{p.category?.name || '—'}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-sm">{p.quantity}</span> {p.unit}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatMoney(p.costPrice)}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatMoney(p.inventoryValue)}
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
                        {canAdjust && (
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setAdjustSelectedProduct(p);
                                setAdjustOpen(true);
                              }}
                            >
                              {t('inventory.adjust')}
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loadingOverview && products.length > 0 && (
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
                      aria-label="Stock items per page"
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
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Stock Movement History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground">{t('inventory.filterByMovement')}</label>
              <Select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="w-48 text-xs h-8"
              >
                <option value="">{t('inventory.allMovements')}</option>
                <option value="RESTOCK">{t('inventory.movementTypes.RESTOCK')}</option>
                <option value="DAMAGE">{t('inventory.movementTypes.DAMAGE')}</option>
                <option value="LOSS">{t('inventory.movementTypes.LOSS')}</option>
                <option value="RETURN">{t('inventory.movementTypes.RETURN')}</option>
                <option value="CORRECTION">{t('inventory.movementTypes.CORRECTION')}</option>
                <option value="SALE_DEDUCTION">{t('inventory.movementTypes.SALE_DEDUCTION')}</option>
                <option value="OPENING_STOCK">{t('inventory.movementTypes.OPENING_STOCK')}</option>
              </Select>
            </div>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  {t('inventory.loading')}
                </div>
              ) : movements.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  {t('inventory.noMovements')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[750px]">
                    <thead className="bg-muted/30 border-b text-muted-foreground">
                      <tr className="text-left font-semibold">
                        <th className="p-3">{t('inventory.timestamp')}</th>
                        <th className="p-3">{t('inventory.product')}</th>
                        <th className="p-3">{t('inventory.movementType')}</th>
                        <th className="p-3 text-center">{t('inventory.change')}</th>
                        <th className="p-3 text-center">{t('inventory.beforeAfter')}</th>
                        <th className="p-3">{t('inventory.performedBy')}</th>
                        <th className="p-3">{t('inventory.reason')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/40">
                          <td className="p-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{m.product.name}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              {m.product.sku}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                m.quantityChange > 0
                                    ? 'success'
                                  : m.quantityChange < 0
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-[10px] uppercase font-bold"
                            >
                              {(t as any)(`inventory.movementTypes.${m.type}`) || m.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span
                              className={`inline-flex items-center gap-0.5 ${
                                m.quantityChange > 0
                                  ? 'text-emerald-600'
                                  : m.quantityChange < 0
                                  ? 'text-destructive'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {m.quantityChange > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                              {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-muted-foreground">
                            {m.quantityBefore} → <strong className="text-foreground">{m.quantityAfter}</strong>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-foreground">{m.performedBy.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{m.performedBy.role}</p>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {m.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogHeader>
          <DialogTitle>{t('inventory.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('inventory.dialogDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold">{t('inventory.selectProduct')} *</label>
            <ProductCombobox
              value={selectedProductId}
              selectedProduct={selectedProduct}
              onSelect={(p) => {
                setSelectedProductId(p.id);
                setAdjustSelectedProduct(p);
              }}
              onClear={() => {
                setSelectedProductId('');
                setAdjustSelectedProduct(null);
              }}
              placeholder="Search 10k+ catalog products by name, SKU, or barcode..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold">{t('inventory.adjustmentType')} *</label>
              <Select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
              >
                <option value="RESTOCK">{t('inventory.movementTypes.RESTOCK')}</option>
                <option value="DAMAGE">{t('inventory.movementTypes.DAMAGE')}</option>
                <option value="LOSS">{t('inventory.movementTypes.LOSS')}</option>
                <option value="RETURN">{t('inventory.movementTypes.RETURN')}</option>
                <option value="CORRECTION">{t('inventory.movementTypes.CORRECTION')}</option>
                <option value="OTHER">{t('inventory.movementTypes.OTHER')}</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">{t('inventory.quantity')} *</label>
              <Input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                required
              />
            </div>
          </div>

          {/* Real-time Preview Calculation */}
          {selectedProduct && (
            <div className="p-3 rounded-lg bg-muted/50 border space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('inventory.currentStock')}:</span>
                <span className="font-bold">{preview.before} {selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('inventory.calculatedChange')}:</span>
                <span className={`font-bold ${preview.change > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {preview.change > 0 ? `+${preview.change}` : preview.change} {selectedProduct.unit}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground font-sans font-semibold">{t('inventory.newExpectedStock')}:</span>
                <span className={`font-bold ${preview.after < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {preview.after} {selectedProduct.unit}
                </span>
              </div>
              {preview.after < 0 && (
                <p className="text-destructive font-sans font-semibold text-[11px] pt-1">
                  ⚠️ {t('inventory.stockBelowZeroError')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold">{t('inventory.reason')} *</label>
            <Input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder={t('inventory.reasonPlaceholder')}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustOpen(false)}
              disabled={isAdjusting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isAdjusting || preview.after < 0 || !adjustReason.trim()}
            >
              {isAdjusting ? t('inventory.savingAdjustment') : t('inventory.commitAdjustment')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

