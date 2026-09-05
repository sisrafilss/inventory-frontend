'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Product, Customer, Warehouse, Sale } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InvoiceMemoModal } from '@/components/sales/invoice-memo-modal';
import {
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Search,
  Printer,
  CreditCard,
  UserCheck,
} from 'lucide-react';

interface FormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { t, formatMoney } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidTouched, setPaidTouched] = useState<boolean>(false);
  const [note, setNote] = useState('');

  const [items, setItems] = useState<FormItem[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Created Sale Memo Modal
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, custRes, whRes] = await Promise.all([
          api.get<Product[]>('/products', { isActive: 'true' }),
          api.get<Customer[]>('/parties/customers'),
          api.get<Warehouse[]>('/warehouses'),
        ]);

        setProducts(prodRes.data);
        setCustomers(custRes.data);
        setWarehouses(whRes.data);

        if (prodRes.data.length > 0) {
          setItems([
            {
              productId: prodRes.data[0].id,
              quantity: 1,
              unitPrice: Number(prodRes.data[0].sellingPrice),
            },
          ]);
        }

        const defWh = whRes.data.find((w) => w.isDefault && w.isActive) || whRes.data[0];
        if (defWh) setWarehouseId(defWh.id);
      } catch (err: any) {
        setError('Failed to fetch initial sales data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const handleAddItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setItems([
      ...items,
      {
        productId: firstProd.id,
        quantity: 1,
        unitPrice: Number(firstProd.sellingPrice),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleProductSelect = (index: number, pId: string) => {
    const prod = productMap.get(pId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: pId,
      unitPrice: prod ? Number(prod.sellingPrice) : 0,
    };
    setItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unitPrice: Math.max(0, price) };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: Math.max(1, qty) };
    setItems(updated);
  };

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone);
    }
  };

  // Grand Total calculation
  let grandTotal = 0;
  const lineDetails = items.map((item) => {
    const prod = productMap.get(item.productId);
    const lineTotal = (item.unitPrice || 0) * (item.quantity || 0);
    grandTotal += lineTotal;
    const isExceedingStock = prod ? item.quantity > prod.quantity : false;
    return { prod, lineTotal, isExceedingStock };
  });

  const effectivePaid = paymentType === 'CASH' && !paidTouched ? grandTotal : paidAmount;
  const dueAmount = Math.max(0, grandTotal - effectivePaid);

  const selectedCustomerObj = customers.find((c) => c.id === customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate items
    for (const item of items) {
      if (!item.productId) {
        setError('Please select a valid product for each line.');
        return;
      }
      if (item.quantity <= 0) {
        setError('Item quantity must be greater than zero.');
        return;
      }
    }

    if (paymentType === 'CREDIT' && !customerId && !customerName.trim()) {
      setError('Please provide customer details for credit sale.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post<Sale>('/sales', {
        customerId: customerId || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        warehouseId: warehouseId || undefined,
        paymentType,
        paidAmount: effectivePaid,
        note: note || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          warehouseId: warehouseId || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });

      setCreatedSale(res.data);
      setMemoOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading POS checkout...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/sales"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sales
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> New Sale / POS Checkout
          </h2>
          <p className="text-xs text-muted-foreground">
            Create cash or customer credit sale with live price overrides & instant memo printing
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-sm text-destructive font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Location Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" /> Customer & Dispatch Information
            </CardTitle>
            <CardDescription className="text-xs">
              Select existing customer to view credit dues or enter walk-in details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Walk-in Customer (Unregistered) —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Due: ৳{Number(c.currentDue).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Warehouse / Godown</label>
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
            </div>

            {selectedCustomerObj && (
              <div className="p-3 bg-primary/10 rounded-md border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{selectedCustomerObj.name}</span>
                  <span className="text-muted-foreground ml-2">Phone: {selectedCustomerObj.phone}</span>
                  {selectedCustomerObj.address && (
                    <span className="text-muted-foreground ml-2">({selectedCustomerObj.address})</span>
                  )}
                </div>
                <div className="text-right font-bold text-rose-600">
                  Previous Due: ৳{Number(selectedCustomerObj.currentDue).toLocaleString()}
                </div>
              </div>
            )}

            {!customerId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Customer Name</label>
                  <Input
                    placeholder="Walk-in Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Customer Phone</label>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">Cart Items & Dynamic Price Overrides</CardTitle>
              <CardDescription className="text-xs">
                Unit prices default to catalog MRP but can be modified on the fly by cashier
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="text-xs gap-1.5 h-8"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => {
              const details = lineDetails[index];
              return (
                <div
                  key={index}
                  className="p-3.5 border border-border rounded-lg bg-card/50 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* Product Selector */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="font-semibold text-foreground">Product *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) - Avail: {p.quantity} {p.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Price Override */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-foreground">Rate (৳)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-foreground">Qty</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-muted-foreground">Line Total</label>
                      <div className="h-9 flex items-center font-bold text-foreground text-sm">
                        ৳{details.lineTotal.toFixed(2)}
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="sm:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {details.isExceedingStock && (
                    <div className="text-[11px] text-destructive font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Quantity exceeds current available stock ({details.prod?.quantity || 0}).
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Payment & Invoice Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-foreground">Payment Type & Notes</h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Sale Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => {
                  const val = e.target.value as 'CASH' | 'CREDIT';
                  setPaymentType(val);
                  if (val === 'CASH') setPaidAmount(grandTotal);
                  else setPaidAmount(0);
                  setPaidTouched(true);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="CASH">Cash Sale (Full Payment / Handover)</option>
                <option value="CREDIT">Credit Sale (Increases Customer Due)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Sale / Delivery Note</label>
              <Input
                placeholder="Optional memo notes, vehicle number, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-3 bg-muted/20">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              Financial Summary
            </h4>

            <div className="flex justify-between items-center text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Grand Total:</span>
              <span className="text-xl font-bold text-foreground">৳{grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Paid Amount (৳):</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={effectivePaid}
                onChange={(e) => {
                  setPaidAmount(parseFloat(e.target.value) || 0);
                  setPaidTouched(true);
                }}
                className="w-36 h-9 text-right font-semibold text-sm"
              />
            </div>

            <div className="flex justify-between items-center text-sm py-1 border-b border-border">
              <span className="text-muted-foreground">Customer Due Generated:</span>
              <span className={`text-lg font-bold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ৳{dueAmount.toFixed(2)}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="w-full h-11 text-base font-semibold mt-4"
            >
              {isSubmitting ? 'Submitting Sale...' : 'Submit Sale for Approval'}
            </Button>
          </Card>
        </div>
      </form>

      {/* Printable Invoice Memo Modal */}
      {createdSale && (
        <InvoiceMemoModal
          sale={createdSale}
          open={memoOpen}
          onOpenChange={(open) => {
            setMemoOpen(open);
            if (!open) router.push('/sales');
          }}
        />
      )}
    </div>
  );
}
