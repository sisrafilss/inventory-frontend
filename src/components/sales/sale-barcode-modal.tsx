'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Barcode,
  Search,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { Product, Customer, Warehouse, Sale } from '@/lib/types';
import { api } from '@/lib/api/client';
import { InvoiceMemoModal, MemoSale } from './invoice-memo-modal';
import { ProductLookupModal } from '../products/product-lookup-modal';

export interface BarcodeSaleLineItem {
  id: string;
  productId: string;
  code: string;
  barcode?: string;
  name: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  purchaseCost: number;
  availableStock: number;
}

interface SaleBarcodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

// Popular sample products for hardware-free simulation
const DEMO_TEST_BARCODES = [
  { name: 'Mojo Cola 250ml', code: '894100000001', sku: 'MOJ-250ML' },
  { name: 'Radhuni Turmeric 200g', code: '894100000180', sku: 'RAD-TUR-200G-FD' },
  { name: 'Teer Soybean Oil 1L', code: '894100000005', sku: 'OIL-SOY-TEE-1L' },
  { name: 'Fresh Masoor Dal 1kg', code: '894100000009', sku: 'DAL-MSR-FRE-1KG' },
  { name: 'Olympic Energy Plus ৳25', code: '894100000013', sku: 'EGY-25TK' },
  { name: 'Clemon Lemon Soda 500ml', code: '894100000017', sku: 'CLM-500ML' },
];

export function SaleBarcodeModal({
  open,
  onOpenChange,
  onSaveSuccess,
}: SaleBarcodeModalProps) {
  // Current Date display e.g. "06-Sep-2026"
  const [currentDate] = useState(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Top Bar & Controls
  const [barcodeInput, setBarcodeInput] = useState('');
  const [memoPreview, setMemoPreview] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Line items in the table
  const [items, setItems] = useState<BarcodeSaleLineItem[]>([]);

  // Checkout & Customer Metadata
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Cash Retail Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [discount, setDiscount] = useState<number | string>('');
  const [discountPercent, setDiscountPercent] = useState<number | string>('');
  const [lastDiscountType, setLastDiscountType] = useState<'amount' | 'percent'>('amount');
  const [isSaving, setIsSaving] = useState(false);

  // Memo modal for preview
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [savedSaleData, setSavedSaleData] = useState<MemoSale | null>(null);

  // Product Catalog Lookup Modal
  const [productLookupOpen, setProductLookupOpen] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input whenever modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      loadCustomers();
    } else {
      setItems([]);
      setDiscount('');
      setDiscountPercent('');
      setLastDiscountType('amount');
      setBarcodeInput('');
      setScanMessage(null);
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const res = await api.get<any>('/parties/customers', { limit: 50 });
      if (res.data?.customers) {
        setCustomers(res.data.customers);
      }
    } catch {
      // Non-blocking
    }
  };

  // Synthesize POS Supermarket Scanner Beep via Web Audio API
  const playBeep = (isSuccess: boolean = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        // High crisp beep: 1760 Hz (A6) for 80ms
        osc.frequency.setValueAtTime(1760, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else {
        // Low error beep: 350 Hz for 150ms
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio might be blocked by browser autoplay policy
    }
  };

  // Process Barcode / Code Scan
  const processScanCode = async (codeToLookup: string) => {
    const raw = codeToLookup.trim();
    if (!raw) return;

    setIsSearching(true);
    setScanMessage(null);

    try {
      const res = await api.get<Product>(`/products/by-code/${encodeURIComponent(raw)}`);
      const prod = res.data;

      if (!prod) {
        throw new Error('Product not found.');
      }

      playBeep(true);
      setScanMessage({ text: `✓ Added: ${prod.name}`, isError: false });

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.productId === prod.id);

        if (existingIndex >= 0) {
          // Increment quantity of existing item
          const updated = [...prev];
          const current = updated[existingIndex];
          const newQty = current.quantity + 1;
          updated[existingIndex] = {
            ...current,
            quantity: newQty,
            amount: Number((newQty * current.rate).toFixed(2)),
          };
          return updated;
        } else {
          // Add new item to table
          const sellingRate = Number(prod.sellingPrice) || 0;
          const purchaseCost = Number(prod.costPrice) || 0;
          const newItem: BarcodeSaleLineItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: prod.id,
            code: prod.sku || prod.barcode || raw,
            barcode: prod.barcode || undefined,
            name: prod.name,
            type: prod.unit || 'Pieces',
            quantity: 1,
            rate: sellingRate,
            amount: sellingRate,
            purchaseCost,
            availableStock: prod.quantity ?? 0,
          };
          return [...prev, newItem];
        }
      });

      // Clear input and keep focus for next scan
      setBarcodeInput('');
    } catch (err: any) {
      playBeep(false);
      setScanMessage({
        text: `Barcode / Code "${raw}" not recognized. Check spelling or try demo barcodes below.`,
        isError: true,
      });
    } finally {
      setIsSearching(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScanCode(barcodeInput);
    }
  };

  const handleSelectProductFromLookup = (prod: Product) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === prod.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + 1;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          amount: Number((newQty * current.rate).toFixed(2)),
        };
        return updated;
      } else {
        const sellingRate = Number(prod.sellingPrice) || 0;
        const purchaseCost = Number(prod.costPrice) || 0;
        const newItem: BarcodeSaleLineItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: prod.id,
          code: prod.sku || prod.barcode || '',
          barcode: prod.barcode || undefined,
          name: prod.name,
          type: prod.unit || 'Pieces',
          quantity: 1,
          rate: sellingRate,
          amount: sellingRate,
          purchaseCost,
          availableStock: prod.quantity ?? 0,
        };
        return [...prev, newItem];
      }
    });

    playBeep(true);
    setScanMessage({ text: `✓ Added: ${prod.name}`, isError: false });
    setProductLookupOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Quantity change
  const handleQuantityChange = (index: number, val: string) => {
    const qty = parseInt(val, 10);
    setItems((prev) => {
      const updated = [...prev];
      const validQty = isNaN(qty) || qty < 1 ? 1 : qty;
      updated[index] = {
        ...updated[index],
        quantity: validQty,
        amount: Number((validQty * updated[index].rate).toFixed(2)),
      };
      return updated;
    });
  };

  // Rate change
  const handleRateChange = (index: number, val: string) => {
    const rate = parseFloat(val);
    setItems((prev) => {
      const updated = [...prev];
      const validRate = isNaN(rate) || rate < 0 ? 0 : rate;
      updated[index] = {
        ...updated[index],
        rate: validRate,
        amount: Number((updated[index].quantity * validRate).toFixed(2)),
      };
      return updated;
    });
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const grossTotal = items.reduce((acc, i) => acc + i.amount, 0);

  const handleDiscountAmountChange = (val: string) => {
    setDiscount(val);
    setLastDiscountType('amount');
    const num = parseFloat(val);
    if (!isNaN(num) && grossTotal > 0) {
      const pct = (num / grossTotal) * 100;
      setDiscountPercent(pct % 1 === 0 ? pct.toString() : pct.toFixed(2));
    } else if (val === '' || num === 0) {
      setDiscountPercent('');
    }
  };

  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercent(val);
    setLastDiscountType('percent');
    const pct = parseFloat(val);
    if (!isNaN(pct) && grossTotal > 0) {
      const amt = (grossTotal * pct) / 100;
      setDiscount(amt.toFixed(2));
    } else if (val === '' || pct === 0) {
      setDiscount('');
    }
  };

  useEffect(() => {
    if (lastDiscountType === 'percent') {
      const pct = parseFloat(String(discountPercent));
      if (!isNaN(pct) && pct > 0 && grossTotal > 0) {
        const amt = (grossTotal * pct) / 100;
        setDiscount(amt.toFixed(2));
      } else if (grossTotal === 0 || !discountPercent || pct === 0) {
        setDiscount('');
      }
    } else if (lastDiscountType === 'amount') {
      const amt = parseFloat(String(discount));
      if (!isNaN(amt) && amt > 0 && grossTotal > 0) {
        const pct = (amt / grossTotal) * 100;
        setDiscountPercent(pct % 1 === 0 ? pct.toString() : pct.toFixed(2));
      } else if (grossTotal === 0 || !discount || amt === 0) {
        setDiscountPercent('');
      }
    }
  }, [grossTotal, lastDiscountType]);

  const discountNum = Math.max(0, parseFloat(String(discount)) || 0);
  const netAmount = Math.max(0, grossTotal - discountNum);

  // Complete & Save Sale
  const handleSaveSale = async () => {
    if (items.length === 0) {
      alert('Please scan or add at least one product before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        paymentType: paymentMode,
        customerId: selectedCustomerId || undefined,
        customerName: customerName || 'Cash Retail Customer',
        customerPhone: customerPhone || undefined,
        discount: discountNum,
        discountPercent: parseFloat(String(discountPercent)) || undefined,
        paidAmount: paymentMode === 'CASH' ? netAmount : 0,
        note: `POS Barcode Sale (${items.length} items)`,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.rate,
          purchaseCost: i.purchaseCost,
        })),
      };

      const res = await api.post<Sale>('/sales', payload);
      const created = res.data;

      if (onSaveSuccess) onSaveSuccess();

      // Check if user wants memo preview
      if (memoPreview && created) {
        const memoFormatted: MemoSale = {
          id: created.id,
          referenceNumber: created.referenceNumber,
          totalAmount: grossTotal,
          discount: discountNum,
          netAmount: netAmount,
          paidAmount: paymentMode === 'CASH' ? netAmount : 0,
          dueAmount: paymentMode === 'CREDIT' ? netAmount : 0,
          paymentType: paymentMode,
          customerName: created.customerName || customerName,
          customerPhone: created.customerPhone || customerPhone,
          createdAt: created.createdAt,
          items: items.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.rate,
            lineTotal: i.amount,
            product: {
              name: i.name,
              sku: i.code,
              unit: i.type,
            },
          })),
        };

        setSavedSaleData(memoFormatted);
        setMemoModalOpen(true);
      } else {
        alert(`Sale completed successfully! Invoice: ${created?.referenceNumber || 'Recorded'}`);
        onOpenChange(false);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to complete sale.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-5xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle (Matches Reference Screenshot) */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Left Status Area & Refresh */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-6 bg-[#004d00] border border-lime-500/40 rounded flex items-center justify-center text-[11px] font-mono text-lime-300 font-bold px-1">
              POS SCANNER
            </div>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setBarcodeInput('');
                setDiscount('0');
                setScanMessage(null);
                inputRef.current?.focus();
              }}
              className="h-6 px-3 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-400 font-bold text-xs tracking-wide shadow-sm transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Center Title */}
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
            Sale Entry
          </h2>

          {/* Right Date Picker & Close Button */}
          <div className="flex items-center gap-2">
            <div className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 text-xs font-mono font-semibold flex items-center gap-1 shadow-inner">
              <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>{currentDate}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center transition-colors shadow"
              aria-label="Close"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-3 sm:p-4 space-y-3 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Top Barcode Input Row (Matches Reference Screenshot) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-200/60 dark:bg-slate-800/60 p-2.5 rounded border border-neutral-300 dark:border-slate-700">
            {/* Left: Barcode Input + View Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Scan barcode / type SKU..."
                  className="w-56 sm:w-72 h-8 px-3 bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border-2 border-neutral-400 dark:border-slate-600 font-mono text-sm focus:outline-none focus:border-emerald-600 shadow-inner"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>

              <button
                type="button"
                onClick={() => setProductLookupOpen(true)}
                disabled={isSaving}
                title="Open Product Catalog to browse and select products"
                className="h-8 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50"
              >
                View
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute scanner beep' : 'Enable scanner beep'}
                className="h-8 px-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300/50 dark:hover:bg-slate-700 rounded transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
              </button>
            </div>

            {/* Right: Memo Preview Checkbox in Red (Matches Screenshot) */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-red-600 dark:text-red-400 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={memoPreview}
                  onChange={(e) => setMemoPreview(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span>Memo Preview</span>
              </label>
            </div>
          </div>

          {/* Quick Hardware-Free Barcode Simulation Bar */}
          <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded border border-neutral-300 dark:border-slate-700 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5" /> Demo Barcodes (Click to Scan):
            </span>
            {DEMO_TEST_BARCODES.map((demo) => (
              <button
                key={demo.code}
                type="button"
                onClick={() => processScanCode(demo.code)}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-neutral-300 dark:border-slate-600 hover:border-emerald-500 rounded text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                title={`Scan ${demo.name} (${demo.code})`}
              >
                {demo.name} <span className="font-mono text-[10px] text-neutral-500">[{demo.code.slice(-4)}]</span>
              </button>
            ))}
          </div>

          {/* Scan Status Toast */}
          {scanMessage && (
            <div
              className={`p-2 rounded text-xs font-semibold flex items-center gap-2 ${
                scanMessage.isError
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {scanMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
              <span>{scanMessage.text}</span>
            </div>
          )}

          {/* Table Container (Styled like the screenshot grid) */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner flex flex-col">
            <div className="max-h-[38vh] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-neutral-400 dark:border-slate-700 font-bold text-neutral-800 dark:text-neutral-200">
                  <tr>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 text-center w-12">SN</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 w-28">Code</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700">Item Name</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 text-center w-20">Type</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Quantity</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 text-right w-24">Rate</th>
                    <th className="py-2 px-2.5 border-r border-neutral-300 dark:border-slate-700 text-right w-28">Amount</th>
                    <th className="py-2 px-2 text-center w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400 dark:text-neutral-500 font-medium">
                        <Barcode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Ready for scanning. Connect a barcode scanner or use demo buttons above.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 dark:hover:bg-slate-900/60 transition-colors">
                        <td className="py-2 px-2.5 border-r border-neutral-200 dark:border-slate-800 text-center font-bold text-neutral-600 dark:text-neutral-400">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 border-r border-neutral-200 dark:border-slate-800 font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                          {item.code}
                        </td>
                        <td className="py-2 px-2.5 border-r border-neutral-200 dark:border-slate-800 font-medium text-neutral-900 dark:text-neutral-100">
                          {item.name}
                        </td>
                        <td className="py-2 px-2.5 border-r border-neutral-200 dark:border-slate-800 text-center text-neutral-600 dark:text-neutral-400">
                          {item.type}
                        </td>
                        <td className="py-1.5 px-2 border-r border-neutral-200 dark:border-slate-800 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className="w-16 h-6 px-1.5 text-center font-mono font-semibold bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 focus:outline-none focus:border-emerald-600 rounded"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-neutral-200 dark:border-slate-800 text-right">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleRateChange(idx, e.target.value)}
                            className="w-20 h-6 px-1.5 text-right font-mono font-semibold bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 focus:outline-none focus:border-emerald-600 rounded"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-neutral-200 dark:border-slate-800 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Empty Canvas Space Matching WinForms Reference Image */}
            <div className="bg-[#b3b3b3] dark:bg-slate-800/90 h-28 w-full border-t border-neutral-300 dark:border-slate-700" />
          </div>

          {/* Bottom Controls & Summary (Matches Screenshot Layout) */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 pt-1">
            {/* Left: Customer & Payment Option */}
            <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded border border-neutral-300 dark:border-slate-700 text-xs">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">Mode:</span>
                <label className="flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="barcodePaymentMode"
                    value="CASH"
                    checked={paymentMode === 'CASH'}
                    onChange={() => setPaymentMode('CASH')}
                    className="accent-emerald-600"
                  />
                  Cash
                </label>
                <label className="flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="barcodePaymentMode"
                    value="CREDIT"
                    checked={paymentMode === 'CREDIT'}
                    onChange={() => setPaymentMode('CREDIT')}
                    className="accent-emerald-600"
                  />
                  Credit / Due
                </label>
              </div>

              {paymentMode === 'CREDIT' && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c) {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone || '');
                      }
                    }}
                    className="h-8 px-2 text-xs border border-neutral-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded font-medium focus:outline-none"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveSale}
                disabled={isSaving || items.length === 0}
                className="h-8 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider rounded shadow flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save & Complete Sale
              </button>
            </div>

            {/* Right: Total, Discount, Net Amount (Exactly as shown in Screenshot) */}
            <div className="space-y-1.5 w-full sm:w-72">
              {/* Total */}
              <div className="flex items-center justify-end gap-3">
                <label className="font-bold text-xs text-neutral-800 dark:text-neutral-200 w-24 text-right">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  className="w-36 h-7 px-2 text-right font-mono font-bold text-sm bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none shadow-inner"
                />
              </div>

              {/* Discount */}
              <div className="flex items-center justify-end gap-3">
                <label className="font-bold text-xs text-red-600 dark:text-red-500 w-24 text-right">
                  Discount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => handleDiscountAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-36 h-7 px-2 text-right font-mono font-bold text-sm bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:border-red-600 shadow-inner"
                />
              </div>

              {/* Discount (%) */}
              <div className="flex items-center justify-end gap-3">
                <label className="font-bold text-xs text-red-600 dark:text-red-500 w-24 text-right">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  placeholder="0"
                  className="w-36 h-7 px-2 text-right font-mono font-bold text-sm bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:border-red-600 shadow-inner"
                />
              </div>

              {/* Net Amount */}
              <div className="flex items-center justify-end gap-3">
                <label className="font-bold text-xs text-neutral-800 dark:text-neutral-200 w-24 text-right">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  className="w-36 h-7 px-2 text-right font-mono font-bold text-sm bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 focus:outline-none shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Memo Preview Modal on checkout */}
      <InvoiceMemoModal
        sale={savedSaleData}
        open={memoModalOpen}
        onOpenChange={(isOpen) => {
          setMemoModalOpen(isOpen);
          if (!isOpen) {
            onOpenChange(false);
          }
        }}
      />

      {/* Product Catalog Lookup Modal with Infinite Scrolling */}
      <ProductLookupModal
        open={productLookupOpen}
        onOpenChange={setProductLookupOpen}
        onSelectProduct={handleSelectProductFromLookup}
        initialSearch={barcodeInput}
      />
    </>
  );
}
