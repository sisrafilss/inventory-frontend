'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Supplier, Warehouse, Product } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Truck,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Package,
  Calculator,
  RotateCcw,
  Save,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react';

interface LineItem {
  productId: string;
  code: string;
  name: string;
  companyName?: string;
  type: string;
  quantity: number;
  dpRate: number;
  commission: number;
  rate: number;
  amount: number;
  remarks: string;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { t, formatMoney } = useLanguage();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');

  // Top Form Metadata
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'SUPPLIER'>('CASH');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierDues, setSupplierDues] = useState(0);

  // Item Entry Row State
  const [entryCode, setEntryCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryCompany, setEntryCompany] = useState('');
  const [entryType, setEntryType] = useState('Pieces');
  const [entryQuantity, setEntryQuantity] = useState<string>('1');
  const [entryDpRate, setEntryDpRate] = useState<string>('0');
  const [entryCommission, setEntryCommission] = useState<string>('0');
  const [entryPurchaseRate, setEntryPurchaseRate] = useState<number>(0);
  const [entryRemarks, setEntryRemarks] = useState('None');
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Table items
  const [items, setItems] = useState<LineItem[]>([]);

  // Totals
  const [discount, setDiscount] = useState<string>('0');
  const [paid, setPaid] = useState<string>('0');
  const [paidTouched, setPaidTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialogs
  const [invoiceAlertOpen, setInvoiceAlertOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [supRes, whRes] = await Promise.all([
          api.get<Supplier[]>('/parties/suppliers'),
          api.get<Warehouse[]>('/warehouses'),
        ]);
        setSuppliers(supRes.data);
        setWarehouses(whRes.data);

        const defWh = whRes.data.find((w) => w.isDefault && w.isActive) || whRes.data[0];
        if (defWh) setWarehouseId(defWh.id);
      } catch (err) {
        console.error('Failed to load suppliers/warehouses:', err);
      }
    };
    loadInitialData();
  }, []);

  // Update calculated purchase rate when DP Rate or Commission changes
  useEffect(() => {
    const dp = parseFloat(entryDpRate) || 0;
    const comm = parseFloat(entryCommission) || 0;
    const net = dp - (dp * comm) / 100;
    setEntryPurchaseRate(Number(net.toFixed(2)));
  }, [entryDpRate, entryCommission]);

  // Lookup Product by Item Code (View button or Enter)
  const handleLookupProduct = async () => {
    const code = entryCode.trim();
    if (!code) return;

    setIsSearchingProduct(true);
    setErrorMsg(null);
    try {
      const res = await api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`);
      const prod = res.data;
      setSelectedProduct(prod);
      setEntryName(prod.name);
      setEntryCompany(prod.company?.name || '');
      setEntryType(prod.unit || 'Pieces');

      const dp = prod.dpRate ? Number(prod.dpRate) : (Number(prod.costPrice) || 0);
      setEntryDpRate(String(dp));
      setEntryCommission(String(prod.commissionPercent || 0));

      // Focus on quantity
      setTimeout(() => qtyInputRef.current?.focus(), 50);
    } catch (err: any) {
      setSelectedProduct(null);
      setErrorMsg(`Product code "${code}" not found in catalog.`);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      setErrorMsg('Please enter an Item Code and click View first.');
      return;
    }

    const qty = parseInt(entryQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    const dp = parseFloat(entryDpRate) || 0;
    const comm = parseFloat(entryCommission) || 0;
    const rate = entryPurchaseRate;
    const amount = Number((qty * rate).toFixed(2));

    const newItem: LineItem = {
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: entryName,
      companyName: entryCompany,
      type: entryType,
      quantity: qty,
      dpRate: dp,
      commission: comm,
      rate,
      amount,
      remarks: entryRemarks || 'None',
    };

    setItems((prev) => [...prev, newItem]);

    // Reset item entry
    setEntryCode('');
    setSelectedProduct(null);
    setEntryName('');
    setEntryCompany('');
    setEntryQuantity('1');
    setEntryDpRate('0');
    setEntryCommission('0');
    setEntryPurchaseRate(0);
    setEntryRemarks('None');
    setErrorMsg(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Financial Calculations
  const totalAmount = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const discountAmount = Math.max(0, parseFloat(discount) || 0);
  const netAmount = Math.max(0, Number((totalAmount - discountAmount).toFixed(2)));

  const effectivePaid = paymentMode === 'CASH' && !paidTouched ? netAmount : Math.max(0, parseFloat(paid) || 0);
  const currentDues = Number(Math.max(0, netAmount - effectivePaid).toFixed(2));

  const handleResetForm = () => {
    setItems([]);
    setInvoiceNumber('');
    setDiscount('0');
    setPaid('0');
    setPaidTouched(false);
    setEntryCode('');
    setSelectedProduct(null);
    setEntryName('');
    setEntryCompany('');
    setEntryQuantity('1');
    setEntryDpRate('0');
    setEntryCommission('0');
    setErrorMsg(null);
  };

  const handleSavePurchase = async () => {
    if (!invoiceNumber.trim()) {
      setInvoiceAlertOpen(true);
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one product to the purchase invoice.');
      return;
    }

    if (paymentMode === 'SUPPLIER' && !supplierId) {
      setErrorMsg('Please select a supplier for credit purchases.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post('/purchases', {
        invoiceNumber: invoiceNumber.trim(),
        paymentType: paymentMode,
        supplierId: supplierId || undefined,
        supplierName: !supplierId ? supplierName : undefined,
        warehouseId: warehouseId || undefined,
        paidAmount: effectivePaid,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          dpRate: i.dpRate,
          commissionPercent: i.commission,
          purchaseRate: i.rate,
        })),
      });

      router.push('/purchases');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to save purchase invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Purchase Entry
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Enter purchase details, DP rates, commissions, and receive stock into inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetForm} className="gap-1.5">
            <RotateCcw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleSavePurchase}
            disabled={isSubmitting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Save Purchase'}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-red-800 dark:text-red-300">{errorMsg}</div>
        </div>
      )}

      {/* Top Meta Card (Cash/Supplier + Invoice + Date) */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Payment Mode Selector */}
            <div className="md:col-span-4 flex items-center gap-6">
              <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Mode:</span>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'CASH'}
                  onChange={() => {
                    setPaymentMode('CASH');
                    setPaidTouched(false);
                  }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Cash
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === 'SUPPLIER'}
                  onChange={() => {
                    setPaymentMode('SUPPLIER');
                    setPaid('0');
                    setPaidTouched(true);
                  }}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                Supplier
              </label>
            </div>

            {/* Date Picker */}
            <div className="md:col-span-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Invoice Number */}
            <div className="md:col-span-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                Invoice *
              </label>
              <Input
                placeholder="Invoice / Memo Box..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9 font-mono font-bold text-sm bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
              />
            </div>
          </div>

          {/* Supplier Details (Shown when Supplier mode is selected) */}
          {paymentMode === 'SUPPLIER' && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const s = suppliers.find((sup) => sup.id === e.target.value);
                    if (s) {
                      setSupplierName(s.name);
                      setSupplierAddress(s.address || '');
                      setSupplierDues(Number(s.currentDue || 0));
                    }
                  }}
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Address</label>
                <Input
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="Address..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Existing Dues</label>
                <div className="h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-bold flex items-center text-red-600">
                  {formatMoney(supplierDues)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Entry Row (Exact Workflow from Video) */}
      <Card className="border-emerald-500/30 dark:border-emerald-500/20 shadow-sm bg-gradient-to-b from-emerald-50/20 to-transparent dark:from-emerald-950/10">
        <CardHeader className="py-3 px-5 border-b border-neutral-200 dark:border-neutral-800">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Item Quick Entry
            </span>
            {selectedProduct && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs">
                Matched: {selectedProduct.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Item Code + View Button */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Item Code *
              </label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="e.g. 937095"
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupProduct();
                    }
                  }}
                  className="font-mono font-bold text-sm h-9"
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={handleLookupProduct}
                  disabled={isSearchingProduct || !entryCode.trim()}
                  className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-semibold"
                >
                  View
                </Button>
              </div>
            </div>

            {/* Item Name */}
            <div className="lg:col-span-4 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Item Name
              </label>
              <Input
                value={entryName}
                readOnly
                placeholder="Autofilled from Code..."
                className="h-9 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800"
              />
            </div>

            {/* Company */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Company
              </label>
              <Input
                value={entryCompany}
                readOnly
                placeholder="Autofilled Company..."
                className="h-9 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800"
              />
            </div>

            {/* Type / Unit */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Type
              </label>
              <Input
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                placeholder="Pieces"
                className="h-9 text-xs font-mono font-medium"
              />
            </div>
          </div>

          {/* Quantity, DP Rate, Commission, Purchase Rate & Add Button */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-3 pt-2 items-end">
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Quantity *
              </label>
              <Input
                ref={qtyInputRef}
                type="number"
                min="1"
                value={entryQuantity}
                onChange={(e) => setEntryQuantity(e.target.value)}
                className="h-9 text-sm font-mono font-bold bg-amber-50/40 dark:bg-amber-950/20"
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                DP Rate (৳)
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                value={entryDpRate}
                onChange={(e) => setEntryDpRate(e.target.value)}
                className="h-9 text-sm font-mono font-bold"
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Commission %
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                max="100"
                value={entryCommission}
                onChange={(e) => setEntryCommission(e.target.value)}
                className="h-9 text-sm font-mono font-bold"
              />
            </div>

            {/* Auto Calculated Purchase Rate */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Purchase Rate (৳)
              </label>
              <div className="h-9 px-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm">
                <span>৳{entryPurchaseRate.toFixed(2)}</span>
                <span className="text-xs text-neutral-500 font-normal">
                  Total: ৳{((parseInt(entryQuantity, 10) || 1) * entryPurchaseRate).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Add Button */}
            <div className="lg:col-span-3">
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="w-full h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Plus className="w-4 h-4" /> Add to Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-600 dark:text-neutral-400 uppercase text-xs border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 w-12">SN</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">DP Rate</th>
                <th className="px-4 py-3 text-right">Rate (Net)</th>
                <th className="px-4 py-3 text-right">Amount (৳)</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-400 text-xs">
                    No items added to purchase yet. Enter Item Code and click "Add to Invoice" above.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
                    <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {item.name}
                      {item.companyName && (
                        <span className="block text-xs text-neutral-500">{item.companyName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{item.type}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-neutral-500">
                      {item.dpRate ? formatMoney(item.dpRate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatMoney(item.rate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {formatMoney(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

        {/* Footer Financial Totals */}
        <div className="bg-neutral-50/70 dark:bg-neutral-900/70 p-5 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Total Amount
            </span>
            <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {formatMoney(totalAmount)}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Discount (৳)
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="h-9 font-mono font-bold text-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
              Net Amount
            </span>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
              {formatMoney(netAmount)}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Paid Amount (৳)
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={effectivePaid}
              onChange={(e) => {
                setPaid(e.target.value);
                setPaidTouched(true);
              }}
              className="h-9 font-mono font-bold text-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
              Current Dues
            </span>
            <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
              {formatMoney(currentDues)}
            </div>
          </div>
        </div>
      </Card>

      {/* Invoice Empty Alert Dialog (Exact match from video) */}
      <Dialog open={invoiceAlertOpen} onOpenChange={setInvoiceAlertOpen}>
        <div className="p-6 text-center space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Invoice Required
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Sorry! Invoice Box is Empty. Please enter an invoice number to continue.
            </p>
          </div>
          <div className="pt-2">
            <Button
              size="sm"
              onClick={() => setInvoiceAlertOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[90px]"
            >
              OK
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
