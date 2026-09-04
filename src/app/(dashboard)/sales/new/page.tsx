'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Product } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, ShoppingBag, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface FormItem {
  productId: string;
  quantity: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { t, formatMoney } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<FormItem[]>([{ productId: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get<Product[]>('/products', { isActive: 'true' });
        setProducts(res.data);
        if (res.data.length > 0) {
          setItems([{ productId: res.data[0].id, quantity: 1 }]);
        }
      } catch (err: any) {
        setError('Failed to fetch available products.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate grand total and line item totals
  let grandTotal = 0;
  const lineDetails = items.map((item) => {
    const prod = productMap.get(item.productId);
    const unitPrice = prod ? prod.sellingPrice : 0;
    const qty = item.quantity || 0;
    const lineTotal = unitPrice * qty;
    grandTotal += lineTotal;
    const isExceedingStock = prod ? qty > prod.quantity : false;
    return { prod, unitPrice, qty, lineTotal, isExceedingStock };
  });

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

    setIsSubmitting(true);

    try {
      await api.post('/sales', {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        note: note || undefined,
        items,
      });

      router.push('/sales');
    } catch (err: any) {
      setError(err.message || 'Failed to submit sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground">{t('sales.loading')}</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/sales"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('sales.backToSales')}
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> {t('sales.createSaleTitle')}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-sm text-destructive font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">{t('sales.customerDetails')}</CardTitle>
            <CardDescription className="text-xs">
              {t('sales.customerDetailsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t('sales.customerName')}</label>
              <Input
                placeholder="Walk-in Customer / Client Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">{t('sales.customerPhone')}</label>
              <Input
                placeholder="Phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-foreground">{t('sales.orderNotes')}</label>
              <Input
                placeholder="Optional sales notes or delivery reference"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold">{t('sales.productLines')}</CardTitle>
              <CardDescription className="text-xs">
                {t('sales.productLinesDesc')}
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddItem}
              className="text-xs gap-1.5 h-8"
            >
              <Plus className="w-3.5 h-3.5" /> {t('sales.addLine')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => {
              const detail = lineDetails[idx];
              return (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-card/60 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      {t('sales.itemsInSale')} #{idx + 1}
                    </label>
                    <Select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="text-xs h-9"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {t('inventory.inStock')}: {p.quantity} {p.unit} — {formatMoney(p.sellingPrice)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      {t('inventory.quantity')}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                      }
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div className="w-28 text-right">
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      {t('sales.unitPrice')}
                    </label>
                    <span className="text-xs font-mono font-medium block pt-1.5 text-muted-foreground">
                      {formatMoney(detail.unitPrice)}
                    </span>
                  </div>

                  <div className="w-32 text-right">
                    <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                      {t('sales.lineTotal')}
                    </label>
                    <span className="text-sm font-bold font-mono block pt-1 text-foreground">
                      {formatMoney(detail.lineTotal)}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-destructive hover:bg-destructive/10 h-9 w-9 p-0 sm:mt-5"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Total summary banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-primary/5 rounded-lg border border-primary/20 gap-2">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {t('sales.totalItems')} <strong>{items.length} {t('sales.itemsCount')}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('sales.serverCalculationNotice')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">{t('sales.grandTotal')}</span>
                <span className="text-2xl font-extrabold text-foreground font-mono">
                  {formatMoney(grandTotal)}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t bg-muted/20">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {t('sales.pendingSubmissionNotice')}
              </span>
            </div>

            <Button type="submit" size="lg" className="w-full sm:w-auto font-semibold" disabled={isSubmitting}>
              {isSubmitting ? t('sales.submittingSale') : t('sales.submitForApproval')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

