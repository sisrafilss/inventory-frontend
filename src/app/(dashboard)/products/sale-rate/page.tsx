'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Product } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tag,
  Search,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowLeft,
  Building2,
} from 'lucide-react';

interface RecentRateUpdate {
  code: string;
  name: string;
  companyName?: string;
  purchaseRate: number;
  saleRate: number;
  updatedAt: string;
}

export default function SaleRatePage() {
  const { t, formatMoney } = useLanguage();

  const [itemCode, setItemCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [saleRateInput, setSaleRateInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [recentUpdates, setRecentUpdates] = useState<RecentRateUpdate[]>([]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = itemCode.trim();
    if (!code) {
      setError('Please enter an Item Code or Barcode.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`);
      setProduct(res.data);
      setSaleRateInput(String(res.data.sellingPrice || ''));
    } catch (err: any) {
      setProduct(null);
      setError(err?.response?.data?.message || `No product found matching code "${code}".`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!product) {
      setError('Please search and select a product first.');
      return;
    }

    const rate = parseFloat(saleRateInput);
    if (isNaN(rate) || rate < 0) {
      setError('Please enter a valid non-negative Sale Rate.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post<Product>('/products/sale-rate', {
        id: product.id,
        code: product.sku,
        saleRate: rate,
      });

      const updated = res.data;
      setProduct(updated);
      setSuccessMsg(`Sale rate for "${updated.name}" updated successfully to ${formatMoney(rate)}.`);

      // Add to recent updates list
      setRecentUpdates((prev) => [
        {
          code: updated.sku,
          name: updated.name,
          companyName: updated.company?.name,
          purchaseRate: Number(updated.costPrice || 0),
          saleRate: rate,
          updatedAt: new Date().toLocaleTimeString(),
        },
        ...prev.filter((r) => r.code !== updated.sku).slice(0, 19),
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update sale rate.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setItemCode('');
    setProduct(null);
    setSaleRateInput('');
    setError(null);
    setSuccessMsg(null);
  };

  const purchaseRate = Number(product?.costPrice || 0);
  const currentSaleRate = parseFloat(saleRateInput) || 0;
  const projectedMargin =
    currentSaleRate > 0 && purchaseRate > 0
      ? (((currentSaleRate - purchaseRate) / currentSaleRate) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Tag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Sale Rate Configuration
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Quickly search items by code, review current purchase costs, and set or update retail selling rates.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-red-800 dark:text-red-300">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{successMsg}</div>
        </div>
      )}

      {/* Main Configuration Card */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-500" />
            Item Search & Price Setting
          </CardTitle>
          <CardDescription>
            Enter the Item Code or Barcode and hit Enter or Search.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Search Row */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Type Item Code or Barcode (e.g., 937095)..."
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="font-mono text-base font-semibold pr-10"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !itemCode.trim()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </Button>
          </form>

          {/* Product Details & Rate Input */}
          {product && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 p-5 space-y-5 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Item Code
                  </label>
                  <div className="text-base font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    {product.sku}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Item Name
                  </label>
                  <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
                    {product.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Company / Brand
                  </label>
                  <div className="text-base font-medium text-neutral-700 dark:text-neutral-300 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    {product.company?.name || 'No Company'}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                    Unit / Stock
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {product.unit || 'Pieces'}
                    </Badge>
                    <Badge
                      className={
                        product.quantity > 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }
                    >
                      {product.quantity} in stock
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                {/* Purchase Rate (Cost) */}
                <div className="p-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-semibold text-neutral-500 block">
                    Latest Purchase Rate (Cost)
                  </span>
                  <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                    {formatMoney(purchaseRate)}
                  </div>
                  {product.dpRate ? (
                    <div className="text-xs text-neutral-500 mt-1">
                      DP Rate: {formatMoney(Number(product.dpRate))} ({product.commissionPercent || 0}% Comm.)
                    </div>
                  ) : null}
                </div>

                {/* New Sale Rate Input */}
                <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-500/60 dark:border-emerald-500/40">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                    Sale Rate (Selling Price) *
                  </label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={saleRateInput}
                      onChange={(e) => setSaleRateInput(e.target.value)}
                      placeholder="0.00"
                      className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-neutral-900"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Expected Profit / Margin */}
                <div className="p-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-semibold text-neutral-500 block">
                    Unit Gross Profit
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {formatMoney(Math.max(0, currentSaleRate - purchaseRate))}
                  </div>
                  {projectedMargin && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Margin: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{projectedMargin}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-semibold shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Rate...' : 'Save Sale Rate'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Updates Table */}
      {recentUpdates.length > 0 && (
        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
          <CardHeader className="py-4 border-b border-neutral-200 dark:border-neutral-800">
            <CardTitle className="text-base font-semibold">
              Recently Updated Sale Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">SN</th>
                    <th className="px-4 py-3">Item Code</th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3 text-right">Purchase Rate</th>
                    <th className="px-4 py-3 text-right">Sale Rate</th>
                    <th className="px-4 py-3 text-right">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {recentUpdates.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30">
                      <td className="px-4 py-3 font-mono text-neutral-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                        {item.companyName || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        {formatMoney(item.purchaseRate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(item.saleRate)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-neutral-500 font-mono">
                        {item.updatedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

