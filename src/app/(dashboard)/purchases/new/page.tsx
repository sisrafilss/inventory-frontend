'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Supplier, Warehouse, Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Truck,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Package,
  Calculator,
  Building2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

interface PurchaseLineItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  warehouseId?: string;
  quantity: number;
  dpRate: number;
  commissionPercent: number;
  purchaseRate: number;
  lineTotal: number;
}

export default function NewPurchasePage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'SUPPLIER'>('CASH');

  const [items, setItems] = useState<PurchaseLineItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidTouched, setPaidTouched] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Product Selection Modal
  const [productSearchModalOpen, setProductSearchModalOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const [supRes, whRes, prodRes] = await Promise.all([
          api.get<Supplier[]>('/parties/suppliers'),
          api.get<Warehouse[]>('/warehouses'),
          api.get<Product[]>('/products', { limit: 500 }),
        ]);
        setSuppliers(supRes.data);
        setWarehouses(whRes.data);
        setAllProducts(prodRes.data);

        // Auto-select default warehouse if available
        const defWh = whRes.data.find((w) => w.isDefault && w.isActive) || whRes.data[0];
        if (defWh) setWarehouseId(defWh.id);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    initData();
  }, []);

  const handleAddProduct = (prod: Product) => {
    const existing = items.find((i) => i.productId === prod.id);
    if (existing) {
      alert('Product already added to purchase list. Adjust quantity below.');
      return;
    }

    const dpRate = Number(prod.dpRate || prod.costPrice || 0);
    const commissionPercent = 0;
    const purchaseRate = dpRate;
    const quantity = 1;
    const lineTotal = purchaseRate * quantity;

    setItems([
      ...items,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        warehouseId: warehouseId || undefined,
        quantity,
        dpRate,
        commissionPercent,
        purchaseRate,
        lineTotal,
      },
    ]);

    setProductSearchModalOpen(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<PurchaseLineItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], ...updates };

      const dp = Math.max(0, Number(item.dpRate) || 0);
      const comm = Math.max(0, Number(item.commissionPercent) || 0);
      const netRate = Number((dp * (1 - comm / 100)).toFixed(2));
      const qty = Math.max(1, parseInt(String(item.quantity), 10) || 1);
      const lineTotal = Number((netRate * qty).toFixed(2));

      next[index] = {
        ...item,
        dpRate: dp,
        commissionPercent: comm,
        purchaseRate: netRate,
        quantity: qty,
        lineTotal,
      };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = Number(
    items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2),
  );

  const effectivePaid = paymentType === 'CASH' && !paidTouched ? totalAmount : paidAmount;
  const dueAmount = Number(Math.max(0, totalAmount - effectivePaid).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one product item to the purchase invoice.');
      return;
    }
    if (paymentType === 'SUPPLIER' && !supplierId) {
      alert('Please select a registered supplier for credit purchases.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/purchases', {
        supplierId: supplierId || undefined,
        supplierName: !supplierId ? supplierName : undefined,
        warehouseId: warehouseId || undefined,
        paymentType,
        paidAmount: effectivePaid,
        note,
        items: items.map((i) => ({
          productId: i.productId,
          warehouseId: i.warehouseId || warehouseId || undefined,
          quantity: i.quantity,
          dpRate: i.dpRate,
          commissionPercent: i.commissionPercent,
          purchaseRate: i.purchaseRate,
        })),
      });

      alert('Purchase recorded and stock added successfully!');
      router.push('/purchases');
    } catch (err: any) {
      alert(err.message || 'Failed to record purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(productSearchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/purchases">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" /> New Purchase Receipt
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter dealer price (DP), commission %, and receive products into warehouses
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top Header Config Card */}
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Supplier */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Supplier / Vendor *</label>
              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  const s = suppliers.find((sup) => sup.id === e.target.value);
                  if (s) setSupplierName(s.name);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Direct / Walk-in Cash Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.companyName ? `(${s.companyName})` : ''} - Due: ৳{Number(s.currentDue).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Destination */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Destination Warehouse *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Type *</label>
              <select
                value={paymentType}
                onChange={(e) => {
                  const val = e.target.value as 'CASH' | 'SUPPLIER';
                  setPaymentType(val);
                  if (val === 'CASH') {
                    setPaidAmount(totalAmount);
                  } else {
                    setPaidAmount(0);
                  }
                  setPaidTouched(true);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="CASH">Cash Purchase</option>
                <option value="SUPPLIER">Supplier Credit (Payable Due)</option>
              </select>
            </div>

            {/* Quick Add Product Button */}
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => setProductSearchModalOpen(true)}
                className="w-full gap-2 h-10"
              >
                <Plus className="w-4 h-4" /> Add Products
              </Button>
            </div>
          </div>
        </Card>

        {/* Purchase Items Table */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Purchase Items ({items.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              DP Rate - Commission % = Net Purchase Rate
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3 w-8">#</th>
                  <th className="p-3 min-w-[200px]">Product / SKU</th>
                  <th className="p-3 w-32 text-right">DP Rate (৳)</th>
                  <th className="p-3 w-28 text-right">Comm %</th>
                  <th className="p-3 w-32 text-right">Net Rate (৳)</th>
                  <th className="p-3 w-28 text-center">Qty</th>
                  <th className="p-3 w-36 text-right">Line Total (৳)</th>
                  <th className="p-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No items added yet. Click "Add Products" above to select goods from catalog.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku} ({item.unit})</div>
                      </td>
                      <td className="p-3 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.dpRate}
                          onChange={(e) =>
                            handleUpdateItem(idx, { dpRate: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.commissionPercent}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              commissionPercent: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="p-3 text-right font-semibold text-foreground">
                        ৳{item.purchaseRate.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              quantity: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="h-8 text-center text-xs w-20 mx-auto"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        ৳{item.lineTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Financial Totals & Submission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Invoice Notes & Memo Details</h4>
            <textarea
              rows={4}
              placeholder="Enter supplier invoice / challan number, delivery truck details, or notes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </Card>

          <Card className="p-5 space-y-3.5 bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Invoice Summary
            </h4>

            <div className="flex items-center justify-between text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Total Purchase Amount:</span>
              <span className="text-lg font-bold text-foreground">৳{totalAmount.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Paid Amount (৳):</span>
              <Input
                type="number"
                min="0"
                max={totalAmount}
                step="0.01"
                value={effectivePaid}
                onChange={(e) => {
                  setPaidAmount(parseFloat(e.target.value) || 0);
                  setPaidTouched(true);
                }}
                className="w-36 h-9 text-right font-semibold"
              />
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Supplier Due (Payable):</span>
              <span
                className={`text-lg font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
              >
                ৳{dueAmount.toLocaleString()}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full h-11 text-base font-semibold mt-4"
            >
              {isSubmitting ? 'Recording Purchase...' : 'Confirm & Receive Stock'}
            </Button>
          </Card>
        </div>
      </form>

      {/* Product Selection Modal */}
      <Dialog open={productSearchModalOpen} onOpenChange={setProductSearchModalOpen}>
        <div>
          <DialogHeader>
            <DialogTitle>Select Catalog Products</DialogTitle>
            <DialogDescription>
              Search by product name, SKU, or scan barcode to add to this purchase
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                autoFocus
                className="pl-9"
              />
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border border border-border rounded-md">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  No products matched "{productSearchQuery}".
                </div>
              ) : (
                filteredProducts.slice(0, 30).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAddProduct(prod)}
                  >
                    <div>
                      <div className="font-semibold text-sm text-foreground">{prod.name}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {prod.sku} • Stock: {prod.quantity} {prod.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Cost / DP:</div>
                      <div className="font-bold text-sm text-foreground">
                        ৳{Number(prod.dpRate || prod.costPrice || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProductSearchModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
