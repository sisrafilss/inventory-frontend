'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Product, Customer, Warehouse, Sale } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { InvoiceMemoModal } from '@/components/sales/invoice-memo-modal';
import { SaleManualModal } from '@/components/sales/sale-manual-modal';
import { SaleBarcodeModal } from '@/components/sales/sale-barcode-modal';
import {
  ShoppingBag,
  Barcode,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Package,
  Calculator,
  RotateCcw,
  Save,
  AlertCircle,
  Calendar,
  FileText,
  UserCheck,
  Building2,
  CheckCircle2,
  Printer,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

interface SaleLineItem {
  productId: string;
  code: string;
  name: string;
  companyName?: string;
  type: string;
  quantity: number;
  saleRate: number;
  amount: number;
  purchaseRate: number;
  purchaseAmount: number;
}

export default function CreateSalePage() {
  const router = useRouter();
  const { t, formatMoney } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [loading, setLoading] = useState(true);

  // Top Form Metadata
  const [saleMode, setSaleMode] = useState<'CASH' | 'CUSTOMER'>('CASH');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-6)}`);
  const [memoPreview, setMemoPreview] = useState<boolean>(true);

  // Customer Details
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDues, setCustomerDues] = useState<number>(0);

  // Item Entry Row State
  const [entryCode, setEntryCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryCompany, setEntryCompany] = useState('');
  const [entryType, setEntryType] = useState('Pieces');
  const [entryDpRate, setEntryDpRate] = useState<number>(0);
  const [entryCommission, setEntryCommission] = useState<number>(0);
  const [entryPurchaseRate, setEntryPurchaseRate] = useState<number>(0);
  const [entryQuantity, setEntryQuantity] = useState<string>('1');
  const [entrySaleRate, setEntrySaleRate] = useState<string>('');
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Table items
  const [items, setItems] = useState<SaleLineItem[]>([]);

  // Totals
  const [discount, setDiscount] = useState<string>('');
  const [paid, setPaid] = useState<string>('');
  const [paidTouched, setPaidTouched] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialogs & Modals
  const [invoiceAlertOpen, setInvoiceAlertOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdSale, setCreatedSale] = useState<Sale | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);

  const qtyInputRef = useRef<HTMLInputElement>(null);
  const rateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [custRes, whRes] = await Promise.all([
          api.get<Customer[]>('/parties/customers'),
          api.get<Warehouse[]>('/warehouses'),
        ]);
        setCustomers(custRes.data);
        setWarehouses(whRes.data);

        const defWh = whRes.data.find((w) => w.isDefault && w.isActive) || whRes.data[0];
        if (defWh) setWarehouseId(defWh.id);
      } catch (err) {
        console.error('Failed to load customers/warehouses:', err);
        setErrorMsg('Failed to load initial sales data.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Update stock when warehouse changes
  useEffect(() => {
    if (selectedProduct) {
      updateStockForProduct(selectedProduct, warehouseId);
    }
  }, [warehouseId]);

  const updateStockForProduct = (prod: Product, whId: string) => {
    let stock = 0;
    if (whId && prod.warehouseStocks) {
      const ws = prod.warehouseStocks.find((s) => s.warehouseId === whId);
      if (ws !== undefined) stock = ws.quantity;
    }
    setAvailableStock(stock);
  };

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
      const comm = Number(prod.commissionPercent || 0);
      const pRate = Number(prod.costPrice) || (dp - (dp * comm) / 100);

      setEntryDpRate(dp);
      setEntryCommission(comm);
      setEntryPurchaseRate(Number(pRate.toFixed(2)));
      setEntrySaleRate('');

      updateStockForProduct(prod, warehouseId);

      // Focus on quantity
      setTimeout(() => qtyInputRef.current?.focus(), 50);
    } catch (err: any) {
      setSelectedProduct(null);
      setErrorMsg(`Product code "${code}" not found in catalog.`);
    } finally {
      setIsSearchingProduct(false);
    }
  };

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone);
      setCustomerAddress(selected.address || '');
      setCustomerDues(Number(selected.currentDue || 0));
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerDues(0);
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

    const saleRate = parseFloat(entrySaleRate);
    if (isNaN(saleRate) || saleRate < 0) {
      setErrorMsg('Please enter a valid sale rate.');
      return;
    }

    // Check against available stock
    const existingQty = items
      .filter((i) => i.productId === selectedProduct.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (existingQty + qty > availableStock) {
      setErrorMsg(
        `Warning: Quantity (${existingQty + qty}) exceeds available stock (${availableStock}) for "${selectedProduct.name}".`
      );
    }

    const amount = Number((qty * saleRate).toFixed(2));
    const purchaseAmount = Number((qty * entryPurchaseRate).toFixed(2));

    const newItem: SaleLineItem = {
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: entryName,
      companyName: entryCompany,
      type: entryType,
      quantity: qty,
      saleRate,
      amount,
      purchaseRate: entryPurchaseRate,
      purchaseAmount,
    };

    setItems((prev) => [...prev, newItem]);

    // Reset item entry
    setEntryCode('');
    setSelectedProduct(null);
    setEntryName('');
    setEntryCompany('');
    setEntryQuantity('1');
    setEntryDpRate(0);
    setEntryCommission(0);
    setEntryPurchaseRate(0);
    setEntrySaleRate('');
    setAvailableStock(0);
    setErrorMsg(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    if (items.length > 0 && !confirm('Are you sure you want to reset this sale?')) {
      return;
    }
    setItems([]);
    setEntryCode('');
    setSelectedProduct(null);
    setEntryName('');
    setEntryCompany('');
    setEntryQuantity('1');
    setEntrySaleRate('');
    setDiscount('');
    setPaid('');
    setPaidTouched(false);
    setNote('');
    setErrorMsg(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
  };

  // Financial Calculations
  const totalAmount = Number(items.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
  const totalCost = Number(items.reduce((sum, item) => sum + item.purchaseAmount, 0).toFixed(2));
  const discountAmount = Math.max(0, parseFloat(discount) || 0);
  const netAmount = Math.max(0, Number((totalAmount - discountAmount).toFixed(2)));
  const grossProfit = Number((netAmount - totalCost).toFixed(2));
  const profitMargin = netAmount > 0 ? Number(((grossProfit / netAmount) * 100).toFixed(1)) : 0;

  const effectivePaid =
    saleMode === 'CASH' && !paidTouched
      ? netAmount
      : Math.max(0, parseFloat(paid) || 0);
  const currentDues = Math.max(0, Number((netAmount - effectivePaid).toFixed(2)));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // 1. Check invoice number
    if (!invoiceNumber.trim()) {
      setInvoiceAlertOpen(true);
      return;
    }

    // 2. Validate items
    if (items.length === 0) {
      setErrorMsg('Please add at least one item to the sale.');
      return;
    }

    // 3. Validate customer if Customer mode
    if (saleMode === 'CUSTOMER' && !customerId && !customerName.trim()) {
      setErrorMsg('Please select or specify a customer for Customer sale.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        referenceNumber: invoiceNumber.trim(),
        customerId: saleMode === 'CUSTOMER' && customerId ? customerId : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        warehouseId: warehouseId || undefined,
        paymentType: saleMode === 'CASH' ? ('CASH' as const) : ('CREDIT' as const),
        discount: discountAmount,
        paidAmount: effectivePaid,
        note: note.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          warehouseId: warehouseId || undefined,
          quantity: i.quantity,
          unitPrice: i.saleRate,
          purchaseCost: i.purchaseRate,
        })),
      };

      const res = await api.post<Sale>('/sales', payload);
      setCreatedSale(res.data);

      if (memoPreview) {
        setMemoOpen(true);
      } else {
        router.push('/sales');
      }
    } catch (err: any) {
      console.error('Failed to create sale:', err);
      setErrorMsg(err.message || 'Failed to complete sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Loading POS sale workspace...
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <Link
            href="/sales"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sales
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" /> Sale Manual (POS Billing)
          </h1>
          <p className="text-xs text-muted-foreground">
            Fast counter sales, live stock validation, gross profit tracking & instant memo printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setManualModalOpen(true)}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Sale by Manual
          </Button>
          <Button
            variant="outline"
            onClick={() => setBarcodeModalOpen(true)}
            className="gap-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
          >
            <Barcode className="w-4 h-4" /> Sale by Bar Code
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex items-start gap-2.5 text-xs text-destructive font-medium">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Configuration & Party Header */}
      <Card className="shadow-sm border-border/80">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Payment Mode Selector */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sale Mode</label>
              <div className="flex items-center gap-4 h-9 px-3 bg-muted/40 rounded-md border border-border">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-foreground">
                  <input
                    type="radio"
                    name="saleMode"
                    value="CASH"
                    checked={saleMode === 'CASH'}
                    onChange={() => {
                      setSaleMode('CASH');
                      setPaidTouched(false);
                    }}
                    className="accent-emerald-600 w-3.5 h-3.5"
                  />
                  Cash Sale
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-foreground">
                  <input
                    type="radio"
                    name="saleMode"
                    value="CUSTOMER"
                    checked={saleMode === 'CUSTOMER'}
                    onChange={() => {
                      setSaleMode('CUSTOMER');
                      setPaidTouched(true);
                      setPaid('0');
                    }}
                    className="accent-emerald-600 w-3.5 h-3.5"
                  />
                  Customer (Credit)
                </label>
              </div>
            </div>

            {/* Date */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date
              </label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Invoice No */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Invoice / Memo No *
              </label>
              <Input
                placeholder="INV-XXXXXX"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="h-9 text-xs font-mono font-medium"
              />
            </div>

            {/* Warehouse */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Godown / Store
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isDefault ? '(Main)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Memo Preview Toggle */}
            <div className="md:col-span-2 flex items-center h-9 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md transition-colors w-full justify-center">
                <input
                  type="checkbox"
                  checked={memoPreview}
                  onChange={(e) => setMemoPreview(e.target.checked)}
                  className="accent-emerald-600 rounded w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-primary" /> Memo Preview
                </span>
              </label>
            </div>
          </div>

          {/* Customer Selection Row */}
          {saleMode === 'CUSTOMER' ? (
            <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-4 space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> Select Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-9 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select Customer from Ledger —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Address / Area</label>
                <Input
                  placeholder="Customer address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Mobile Contact</label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-1 text-right">
                <label className="text-xs font-semibold text-rose-600 block">Previous Due</label>
                <div className="h-9 flex items-center justify-end px-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-bold text-xs">
                  ৳{customerDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Walk-in Customer Name (Optional)
                </label>
                <Input
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Mobile / Reference (Optional)
                </label>
                <Input
                  placeholder="01XXXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Entry Row (Video Workflow: Item Code -> View -> Autofill -> Qty -> Sale Rate -> Add) */}
      <Card className="shadow-sm border-border/80 bg-card/60">
        <CardHeader className="py-2.5 px-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold tracking-wider uppercase text-foreground flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" /> Item Entry & Rate Resolution
            </CardTitle>
            {selectedProduct && (
              <Badge
                variant="outline"
                className={`text-[11px] font-semibold ${
                  availableStock > 0
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                In Stock: {availableStock} {selectedProduct.unit || 'Pieces'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            {/* Item Code + View */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground">Item Code *</label>
              <div className="flex gap-1">
                <Input
                  placeholder="Code/SKU"
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupProduct();
                    }
                  }}
                  className="h-9 text-xs font-mono"
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleLookupProduct}
                  disabled={isSearchingProduct || !entryCode.trim()}
                  className="h-9 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
                >
                  {isSearchingProduct ? '...' : 'View'}
                </Button>
              </div>
            </div>

            {/* Product Name */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-bold text-foreground">Item Name</label>
              <Input
                placeholder="Product name"
                value={entryName}
                readOnly
                className="h-9 text-xs bg-muted/30 font-medium"
              />
            </div>

            {/* Company */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground">Company</label>
              <Input
                placeholder="Company/Brand"
                value={entryCompany}
                readOnly
                className="h-9 text-xs bg-muted/30"
              />
            </div>

            {/* Purchase Rate (P_Rate) Reference */}
            <div className="sm:col-span-1 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" title="Purchase Cost Rate">
                P_Rate
              </label>
              <div className="h-9 flex items-center justify-end px-2 rounded-md bg-muted/40 border border-input text-xs font-mono font-medium text-muted-foreground">
                {entryPurchaseRate.toFixed(2)}
              </div>
            </div>

            {/* Quantity */}
            <div className="sm:col-span-1 space-y-1">
              <label className="text-xs font-bold text-foreground">Qty *</label>
              <Input
                ref={qtyInputRef}
                type="number"
                min="1"
                value={entryQuantity}
                onChange={(e) => setEntryQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    rateInputRef.current?.focus();
                  }
                }}
                className="h-9 text-xs text-right font-semibold"
              />
            </div>

            {/* Sale Rate */}
            <div className="sm:col-span-1 space-y-1">
              <label className="text-xs font-bold text-foreground">Rate (৳) *</label>
              <Input
                ref={rateInputRef}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={entrySaleRate}
                onChange={(e) => setEntrySaleRate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                className="h-9 text-xs text-right font-semibold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {/* Line Amount Preview */}
            <div className="sm:col-span-1 space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Amount (৳)</label>
              <div className="h-9 flex items-center justify-end px-2 rounded-md bg-muted/40 border border-input text-xs font-bold text-foreground font-mono">
                {(
                  (parseInt(entryQuantity, 10) || 0) * (parseFloat(entrySaleRate) || 0)
                ).toFixed(2)}
              </div>
            </div>

            {/* Add Button */}
            <div className="sm:col-span-1">
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct}
                className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table (Matches Video Grid Columns) */}
      <Card className="shadow-sm border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-bold border-b border-border">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">SN</th>
                <th className="py-2.5 px-3 w-28">Item Code</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3 w-20">Type</th>
                <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                <th className="py-2.5 px-3 w-24 text-right">Rate (৳)</th>
                <th className="py-2.5 px-3 w-28 text-right font-bold text-foreground">Amount (৳)</th>
                <th className="py-2.5 px-3 w-24 text-right text-muted-foreground">P_Rate</th>
                <th className="py-2.5 px-3 w-28 text-right text-muted-foreground">P_Amount</th>
                <th className="py-2.5 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted-foreground text-xs">
                    No items added to invoice yet. Enter an Item Code above and click View.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{index + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-primary font-semibold">{item.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">{item.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{item.companyName || '—'}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{item.type}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">
                      {item.saleRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-foreground">
                      ৳{item.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">
                      {item.purchaseRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground font-mono">
                      ৳{item.purchaseAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Summary Bar & Executive Profit Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Remarks / Sale Note */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="shadow-sm border-border/80 p-4 space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Sale / Memo Note
            </label>
            <Input
              placeholder="Delivery notes, vehicle number, or special instructions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs h-10"
            />
            <p className="text-[11px] text-muted-foreground italic">
              * Included directly in printed customer memo voucher
            </p>
          </Card>

          {/* Executive Profit Overview Card (Exact match to video counters!) */}
          <Card className="shadow-sm border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Real-time Profit Counter
              </span>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px]">
                Live Metric
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-500/20 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold">Total Cost</div>
                <div className="text-xs font-bold text-foreground">৳{totalCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold">Gross Profit</div>
                <div
                  className={`text-xs font-bold ${
                    grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                  }`}
                >
                  ৳{grossProfit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold">Margin</div>
                <div className="text-xs font-bold text-foreground">{profitMargin}%</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Financial Billing Totals & Actions */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
              {/* Total Amount */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Total (৳)
                </label>
                <div className="h-9 flex items-center px-2.5 rounded-md bg-background border border-input text-sm font-bold text-foreground">
                  ৳{totalAmount.toFixed(2)}
                </div>
              </div>

              {/* Discount (৳) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground uppercase">
                  Discount (৳)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-9 text-xs font-semibold text-right"
                />
              </div>

              {/* Net Amount */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary uppercase">
                  Net Amount (৳)
                </label>
                <div className="h-9 flex items-center px-2.5 rounded-md bg-primary/10 border border-primary/30 text-sm font-black text-primary">
                  ৳{netAmount.toFixed(2)}
                </div>
              </div>

              {/* Paid (৳) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  Paid (৳)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paidTouched ? paid : (saleMode === 'CASH' && effectivePaid > 0 ? effectivePaid : (paid || ''))}
                  onChange={(e) => {
                    setPaid(e.target.value);
                    setPaidTouched(true);
                  }}
                  className="h-9 text-xs font-bold text-right text-emerald-600 dark:text-emerald-400"
                />
              </div>

              {/* Current Dues */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-rose-600 uppercase">
                  Current Dues (৳)
                </label>
                <div
                  className={`h-9 flex items-center px-2.5 rounded-md border text-sm font-bold ${
                    currentDues > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-600'
                      : 'bg-background border-input text-muted-foreground'
                  }`}
                >
                  ৳{currentDues.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs gap-1.5 h-10 px-4 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>

              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || items.length === 0}
                className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-10 px-6 shadow"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Sale...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & {memoPreview ? 'Preview Memo' : 'Complete Sale'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invoice Empty Alert Dialog (Exact match from video!) */}
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

      {/* Desktop Sale Manual Modal */}
      <SaleManualModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        onSaveSuccess={() => router.push('/sales')}
      />

      {/* Desktop Sale by Bar Code Modal */}
      <SaleBarcodeModal
        open={barcodeModalOpen}
        onOpenChange={setBarcodeModalOpen}
        onSaveSuccess={() => router.push('/sales')}
      />
    </div>
  );
}
