'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, StockMovement, StockMovementType } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  // Overview state
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // History state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState('');

  // Adjustment Modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustType, setAdjustType] = useState<StockMovementType>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.get<{ summary: any; products: any[] }>('/inventory/overview');
      setSummary(res.data.summary);
      setProducts(res.data.products);
      if (res.data.products.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data.products[0].id);
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
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyFilterType]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

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
      alert(err.message || 'Failed to adjust stock.');
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
            <Boxes className="w-6 h-6 text-primary" /> Inventory & Stock Control
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time inventory levels, financial valuation, and complete movement logs
          </p>
        </div>

        {canAdjust && (
          <Button onClick={() => setAdjustOpen(true)} className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" /> Adjust Stock
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Quantity in Stock</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {summary.totalQuantity} <span className="text-xs font-normal text-muted-foreground">units</span>
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Cost Valuation</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(summary.totalCostValue)}
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Retail Valuation</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(summary.totalRetailValue)}
            </h3>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Low / Depleted Stock Items</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {summary.lowStockCount + summary.outOfStockCount}{' '}
              <span className="text-xs font-normal text-muted-foreground">items</span>
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
          Current Stock Valuation
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 text-xs font-semibold transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Stock Movement History (Audit)
        </button>
      </div>

      {/* Tab 1: Current Stock Overview */}
      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-0">
            {loadingOverview ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Loading stock levels...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">In Stock</th>
                      <th className="p-3 text-right">Unit Cost</th>
                      <th className="p-3 text-right">Total Cost Value</th>
                      <th className="p-3">Status</th>
                      {canAdjust && <th className="p-3 text-right">Quick Action</th>}
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
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatCurrency(p.inventoryValue)}
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
                            {p.stockStatus.replace('_', ' ')}
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
                                setAdjustOpen(true);
                              }}
                            >
                              Adjust
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <label className="text-xs font-semibold text-muted-foreground">Filter by Movement Type:</label>
              <Select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="w-48 text-xs h-8"
              >
                <option value="">All Movement Types</option>
                <option value="RESTOCK">Restock (+)</option>
                <option value="DAMAGE">Damage (-)</option>
                <option value="LOSS">Loss (-)</option>
                <option value="RETURN">Return (+)</option>
                <option value="CORRECTION">Correction (+/-)</option>
                <option value="SALE_DEDUCTION">Sale Deduction (-)</option>
                <option value="OPENING_STOCK">Opening Stock (+)</option>
              </Select>
            </div>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loadingHistory ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  Loading movement logs...
                </div>
              ) : movements.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No stock movements recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 border-b text-muted-foreground">
                      <tr className="text-left font-semibold">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Movement Type</th>
                        <th className="p-3 text-center">Change</th>
                        <th className="p-3 text-center">Before → After</th>
                        <th className="p-3">Performed By</th>
                        <th className="p-3">Reason / Reference</th>
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
                              {m.type.replace('_', ' ')}
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
          <DialogTitle>Manual Inventory Stock Adjustment</DialogTitle>
          <DialogDescription>
            Record an audited inventory increase, damage write-off, or stock reconciliation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-semibold">Select Product *</label>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — Current: {p.quantity} {p.unit}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold">Adjustment Type *</label>
              <Select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
              >
                <option value="RESTOCK">Restock (Add Stock)</option>
                <option value="DAMAGE">Damage (Deduct Stock)</option>
                <option value="LOSS">Loss / Theft (Deduct Stock)</option>
                <option value="RETURN">Customer Return (Add Stock)</option>
                <option value="CORRECTION">Manual Count Correction</option>
                <option value="OTHER">Other Reason</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold">Quantity *</label>
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
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="font-bold">{preview.before} {selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calculated Change:</span>
                <span className={`font-bold ${preview.change > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {preview.change > 0 ? `+${preview.change}` : preview.change} {selectedProduct.unit}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground font-sans font-semibold">New Expected Stock:</span>
                <span className={`font-bold ${preview.after < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {preview.after} {selectedProduct.unit}
                </span>
              </div>
              {preview.after < 0 && (
                <p className="text-destructive font-sans font-semibold text-[11px] pt-1">
                  ⚠️ Error: Stock cannot drop below zero.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold">Reason / Audit Justification *</label>
            <Input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Broken packaging during handling, monthly restock invoice #1029"
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
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isAdjusting || preview.after < 0 || !adjustReason.trim()}
            >
              {isAdjusting ? 'Saving Adjustment...' : 'Commit Stock Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

