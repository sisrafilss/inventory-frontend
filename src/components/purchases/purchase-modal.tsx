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
} from 'lucide-react';
import { Product, Supplier, Warehouse } from '@/lib/types';
import { api } from '@/lib/api/client';

export interface PurchaseLineItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks: string;
  dpRate: number;
  commission: number;
}

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductCode?: string;
  onSaveSuccess?: () => void;
}

export function PurchaseModal({
  open,
  onOpenChange,
  initialProductCode,
  onSaveSuccess,
}: PurchaseModalProps) {
  // Banner prompt text (e.g. "Type Product Code", "Type Quantity . . .")
  const [bannerPrompt, setBannerPrompt] = useState('Type Product Code');

  // Payment mode: CASH or SUPPLIER
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'SUPPLIER'>('CASH');

  // Date and Invoice
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Supplier & Warehouse State
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [supplierId, setSupplierId] = useState('0');
  const [supplierName, setSupplierName] = useState('Cash Party');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierDues, setSupplierDues] = useState('0.00');

  // Item form fields
  const [itemCode, setItemCode] = useState(initialProductCode || '');
  const [debouncedCode, setDebouncedCode] = useState(initialProductCode || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemName, setItemName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [itemType, setItemType] = useState('Pieces');
  const [dpRate, setDpRate] = useState<number | string>('');
  const [commission, setCommission] = useState<number | string>('');
  const [purchaseRate, setPurchaseRate] = useState<number | string>('');

  // Loading & status flags
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [activeFocusedField, setActiveFocusedField] = useState<string>('itemCode');

  // Line items in the table
  const [lineItems, setLineItems] = useState<PurchaseLineItem[]>([]);

  // Summary calculations
  const [paidAmount, setPaidAmount] = useState<number | string>('0.00');
  const [paidTouched, setPaidTouched] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>('0.00');

  // Dialogs
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ref for auto-focusing quantity
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Load suppliers and warehouses on mount / open
  useEffect(() => {
    if (!open) return;
    api.get<Supplier[]>('/parties/suppliers')
      .then((res) => {
        if (res.data) setSuppliersList(res.data);
      })
      .catch(() => {});

    api.get<Warehouse[]>('/warehouses')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const def = res.data.find((w) => w.isDefault && w.isActive) || res.data[0];
          if (def) setDefaultWarehouseId(def.id);
        }
      })
      .catch(() => {});
  }, [open]);

  // If initialProductCode provided
  useEffect(() => {
    if (open && initialProductCode) {
      setItemCode(initialProductCode);
      setDebouncedCode(initialProductCode);
    }
  }, [open, initialProductCode]);

  // Debounce Item Code while typing (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(itemCode.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [itemCode]);

  // Fetch product as soon as debouncedCode changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedCode.toUpperCase();
    if (!code || code.length === 0) {
      setCodeWarning(null);
      setCodeSuccess(false);
      setIsSearchingProduct(false);
      return;
    }

    // Skip if already loaded
    if (selectedProduct && selectedProduct.sku.toUpperCase() === code) {
      return;
    }

    let active = true;
    setIsSearchingProduct(true);
    setCodeWarning(null);
    setCodeSuccess(false);
    setBannerPrompt('Searching product...');

    api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          setSelectedProduct(p);
          setItemName(p.name || '');
          setCompanyName(p.company?.name || '');
          setItemType(p.unit || 'Pieces');
          const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
          setDpRate(dp > 0 ? String(dp) : '0');
          const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
          setCommission(comm > 0 ? String(comm) : '0');
          const pRate = p.costPrice ? Number(p.costPrice) : (dp > 0 ? dp : 0);
          setPurchaseRate(pRate > 0 ? String(pRate) : '0');
          setCodeSuccess(true);
          setCodeWarning(null);
          setBannerPrompt('Type Quantity . . .');
          setActiveFocusedField('quantity');
          setTimeout(() => qtyInputRef.current?.focus(), 80);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedProduct(null);
        setItemName('');
        setCompanyName('');
        setDpRate('');
        setCommission('');
        setPurchaseRate('');
        setCodeSuccess(false);
        setCodeWarning(`Product code "${code}" does not exist in database.`);
        setBannerPrompt(`Product code "${code}" not found`);
      })
      .finally(() => {
        if (active) setIsSearchingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCode, open]);

  // Recalculate purchase rate when DP Rate or Commission changes
  useEffect(() => {
    const dp = parseFloat(String(dpRate)) || 0;
    const comm = parseFloat(String(commission)) || 0;
    if (dp > 0) {
      const net = dp - (dp * comm) / 100;
      setPurchaseRate(net.toFixed(2));
    }
  }, [dpRate, commission]);

  // Supplier selection helper
  const handleSelectSupplier = (sId: string) => {
    setSupplierId(sId);
    const s = suppliersList.find((sup) => sup.id === sId);
    if (s) {
      setSupplierName(s.name);
      setSupplierAddress(s.address || '');
      const due = s.currentDue ?? s.openingDue ?? 0;
      setSupplierDues(Number(due).toFixed(2));
    } else {
      setSupplierName('');
      setSupplierAddress('');
      setSupplierDues('0.00');
    }
  };

  // Add line item to table
  const handleAddItem = () => {
    if (!selectedProduct) {
      setValidationWarning('Please enter a valid Item Code and select a product first.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setValidationWarning('Quantity must be greater than 0.');
      setTimeout(() => qtyInputRef.current?.focus(), 50);
      return;
    }

    const rate = Number(purchaseRate) || Number(dpRate) || 0;
    const amount = Number((qty * rate).toFixed(2));

    const newItem: PurchaseLineItem = {
      id: Math.random().toString(),
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: itemName || selectedProduct.name,
      type: itemType,
      quantity: qty,
      rate,
      amount,
      remarks: '',
      dpRate: Number(dpRate) || 0,
      commission: Number(commission) || 0,
    };

    setLineItems((prev) => [...prev, newItem]);

    // Reset item inputs for next product entry
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setQuantity('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setBannerPrompt('Type Product Code');
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear / Refresh form
  const handleRefresh = () => {
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setQuantity('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setLineItems([]);
    setPaidAmount('0.00');
    setPaidTouched(false);
    setDiscountAmount('0.00');
    setInvoiceNumber('');
    setBannerPrompt('Type Product Code');
    setActiveFocusedField('itemCode');

    if (paymentMode === 'CASH') {
      setSupplierId('0');
      setSupplierName('Cash Party');
      setSupplierAddress('');
      setSupplierDues('0.00');
    }
  };

  // Total calculations
  const totalAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const discountVal = Number(discountAmount) || 0;
  const netAmount = Math.max(0, totalAmount - discountVal);

  // If cash mode and paid not explicitly edited, paid = netAmount
  const effectivePaid =
    paymentMode === 'CASH' && !paidTouched
      ? netAmount
      : Math.max(0, parseFloat(String(paidAmount)) || 0);

  const currentDues = Number(Math.max(0, netAmount - effectivePaid).toFixed(2));

  // Trigger Save check
  const handleInitiateSave = () => {
    if (lineItems.length === 0) {
      setValidationWarning('Please add at least one product to the purchase invoice before saving.');
      return;
    }

    if (paymentMode === 'SUPPLIER' && (!supplierId || supplierId === '0')) {
      setValidationWarning('Please select a valid supplier for supplier/credit purchases.');
      return;
    }

    setShowConfirmSave(true);
  };

  // Execute Save to Database
  const handleExecuteSavePurchase = async () => {
    setIsSaving(true);
    try {
      await api.post('/purchases', {
        invoiceNumber: invoiceNumber.trim() || undefined,
        paymentType: paymentMode,
        supplierId: paymentMode === 'SUPPLIER' && supplierId !== '0' ? supplierId : undefined,
        supplierName: paymentMode === 'CASH' ? (supplierName || 'Cash Party') : undefined,
        warehouseId: defaultWarehouseId || undefined,
        paidAmount: effectivePaid,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          dpRate: item.dpRate,
          commissionPercent: item.commission,
          purchaseRate: item.rate,
        })),
      });

      setShowConfirmSave(false);
      handleRefresh();
      if (onSaveSuccess) onSaveSuccess();
      alert('Purchase invoice saved successfully to database!');
      onOpenChange(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to save purchase invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isSaving && onOpenChange(isOpen)}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-5xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Dynamic prompt on left */}
          <div className="text-lime-300 font-bold text-lg sm:text-xl tracking-wide select-none drop-shadow-sm flex items-center gap-2">
            <span>{bannerPrompt}</span>
            {isSearchingProduct && <Loader2 className="w-4 h-4 animate-spin text-lime-300 inline" />}
          </div>

          {/* Center Title */}
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
            Purchase
          </h2>

          {/* Close Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body Container */}
        <div className="p-3 sm:p-4 space-y-3 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Upper Section: Actions Stack (Left), Item Form (Middle), Supplier/Payment Info (Right) */}
          <div className="flex flex-col lg:flex-row justify-between gap-4 items-start">
            {/* 1. Left Action Buttons Stack */}
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto shrink-0 justify-start pt-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={handleInitiateSave}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="w-24 sm:w-28 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exit
              </button>
            </div>

            {/* 2. Middle Form Fields (Item Details) */}
            <div className="space-y-1.5 flex-1 w-full max-w-md">
              {/* Item Code & View Button */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="relative flex items-center">
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={itemCode}
                        onChange={(e) => {
                          setItemCode(e.target.value.toUpperCase());
                          if (codeWarning) setCodeWarning(null);
                        }}
                        onFocus={() => {
                          setBannerPrompt('Type Product Code');
                          setActiveFocusedField('itemCode');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setDebouncedCode(itemCode.trim());
                          }
                        }}
                        placeholder="e.g. 937095"
                        disabled={isSaving}
                        className="w-32 sm:w-40 h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                      />
                      {isSearchingProduct && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                      {!isSearchingProduct && codeSuccess && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDebouncedCode(itemCode.trim())}
                      disabled={isSaving || isSearchingProduct}
                      className="h-6 px-3 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Warning when product code does not exist */}
                {codeWarning && (
                  <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold pl-26 pt-0.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{codeWarning}</span>
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onFocus={() => {
                    setBannerPrompt('Type Item Name');
                    setActiveFocusedField('itemName');
                  }}
                  disabled={isSaving}
                  placeholder="Product name"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>

              {/* Company */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSaving}
                  placeholder="Company name"
                  className="w-44 sm:w-56 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>

              {/* Quantity & Type Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={() => {
                      setBannerPrompt('Type Quantity . . .');
                      setActiveFocusedField('quantity');
                    }}
                    onBlur={() => setActiveFocusedField('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    disabled={isSaving}
                    placeholder="0"
                    className={`w-28 h-6 px-2 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none transition-colors disabled:opacity-50 ${
                      activeFocusedField === 'quantity'
                        ? 'bg-[#ffff00] text-black ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                  />
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                    disabled={isSaving}
                    className="w-24 sm:w-28 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-50"
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
              </div>

              {/* DP Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  DP Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dpRate}
                  onChange={(e) => setDpRate(e.target.value)}
                  onFocus={() => setBannerPrompt('Type DP Rate')}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-28 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Commission */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Commission
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  onFocus={() => setBannerPrompt('Type Commission')}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-28 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Purchase Rate & Add Button */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Purchase Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseRate}
                    onChange={(e) => setPurchaseRate(e.target.value)}
                    onFocus={() => setBannerPrompt('Type Purchase Rate')}
                    disabled={isSaving}
                    placeholder="0.00"
                    className="w-28 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isSaving}
                    className="h-6 px-6 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Right Section: Cash / Supplier Radio (Bigger & Bold), Date, Invoice, Supplier Info */}
            <div className="space-y-1.5 flex-1 w-full max-w-sm">
              {/* Cash / Supplier Radio + Date Header */}
              <div className="flex items-center justify-between gap-4 pb-1">
                {/* Enriched & Enlarged Cash & Supplier Radio Buttons */}
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 select-none">
                    <input
                      type="radio"
                      name="paymentMode"
                      checked={paymentMode === 'CASH'}
                      onChange={() => {
                        setPaymentMode('CASH');
                        setSupplierId('0');
                        setSupplierName('Cash Party');
                        setSupplierAddress('');
                        setSupplierDues('0.00');
                      }}
                      disabled={isSaving}
                      className="accent-emerald-700 dark:accent-emerald-500 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 select-none">
                    <input
                      type="radio"
                      name="paymentMode"
                      checked={paymentMode === 'SUPPLIER'}
                      onChange={() => {
                        setPaymentMode('SUPPLIER');
                        if (suppliersList.length > 0) {
                          handleSelectSupplier(suppliersList[0].id);
                        } else {
                          setSupplierId('');
                          setSupplierName('');
                          setSupplierAddress('');
                          setSupplierDues('0.00');
                        }
                      }}
                      disabled={isSaving}
                      className="accent-emerald-700 dark:accent-emerald-500 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                    />
                    <span>Supplier</span>
                  </label>
                </div>

                {/* Date Box */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs">
                  <span>{purchaseDate}</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
                </div>
              </div>

              {/* Supplier ID & Invoice */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Supplier ID
                </label>
                {paymentMode === 'SUPPLIER' && suppliersList.length > 0 ? (
                  <select
                    value={supplierId}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    disabled={isSaving}
                    className="w-24 h-6 px-1 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select</option>
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    disabled={isSaving || paymentMode === 'CASH'}
                    className="w-24 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                  />
                )}
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 ml-auto mr-1">Invoice</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  disabled={isSaving}
                  placeholder="AUTO"
                  className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs disabled:opacity-50"
                />
              </div>

              {/* Supplier Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  disabled={isSaving || paymentMode === 'CASH'}
                  placeholder="Supplier / Party Name"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Address */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Address
                </label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  disabled={isSaving || paymentMode === 'CASH'}
                  placeholder="Supplier Address"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Dues */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Dues
                </label>
                <input
                  type="text"
                  value={supplierDues}
                  readOnly
                  className="w-28 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Middle Section: Items Purchase Table Grid */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner mt-2">
            <div className="max-h-52 sm:max-h-56 overflow-y-auto overflow-x-auto min-h-[140px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-10 text-center font-bold">SN</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-bold">Code</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[160px] font-bold">Item Name</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 font-bold">Type</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">Quantity</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">Rate</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">Amount</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[120px] font-bold">Remarks</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-16 text-center font-bold">Action</th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">DP Rate</th>
                    <th className="py-1 px-2 text-right font-bold w-20">Commission</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-neutral-500 font-medium italic bg-white dark:bg-slate-900">
                        No purchase items added yet. Type item code above and click Add.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, idx) => {
                      const isCyan = idx % 2 === 1;
                      return (
                        <tr
                          key={item.id}
                          className={`${
                            isCyan
                              ? 'bg-[#e0f7fa] dark:bg-cyan-950/40'
                              : 'bg-white dark:bg-slate-900'
                          } text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800 transition-colors`}
                        >
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">{idx + 1}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono font-semibold">{item.code}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.name}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.type}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">{item.quantity}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">{item.rate.toFixed(2)}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">{item.amount.toFixed(2)}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">{item.remarks || '—'}</td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isSaving}
                              className="text-red-600 hover:text-red-800 p-0.5 disabled:opacity-50"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">{item.dpRate.toFixed(2)}</td>
                          <td className="py-0.5 px-2 text-right">{item.commission}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* Grey backdrop filling remaining space */}
              <div className="flex-1 min-h-[50px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>

          {/* Bottom Summary Area (Paid, Current Dues on Left - Total, Discount, Net Amount on Right) */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
            {/* Left Summary: Paid & Current Dues */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paidTouched ? paidAmount : effectivePaid}
                  onChange={(e) => {
                    setPaidTouched(true);
                    setPaidAmount(e.target.value);
                  }}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-32 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Current Dues
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentDues.toFixed(2)}
                  className="w-32 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>

            {/* Right Summary: Total, Discount, Net Amount */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={totalAmount.toFixed(2)}
                  className="w-36 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-red-600 dark:text-red-500 w-24 text-right">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-36 h-6 px-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-neutral-400 dark:border-slate-600 text-right font-bold disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-100 w-24 text-right">
                  Net Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={netAmount.toFixed(2)}
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Save Confirmation Dialog (matching Add Product modal style) */}
      <Dialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        closeOnBackdropClick={!isSaving}
        className="max-w-md p-6 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Save Purchase Invoice?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Please confirm saving this purchase invoice to the database.
              </p>
            </div>
          </div>

          <div className="bg-muted/40 p-3 rounded text-xs space-y-1.5 border border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice:</span>
              <span className="font-mono font-bold text-foreground">
                {invoiceNumber || 'Auto-generated'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Mode:</span>
              <span className="font-bold text-foreground">{paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Party Name:</span>
              <span className="font-bold text-foreground">{supplierName || 'Cash Party'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-bold text-foreground">{lineItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-foreground">৳{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-bold text-emerald-600">৳{effectivePaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Dues:</span>
              <span className="font-bold text-red-600">৳{currentDues.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => setShowConfirmSave(false)}
              className="min-w-[80px]"
            >
              No
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[95px] flex items-center justify-center gap-1.5 font-semibold"
              onClick={handleExecuteSavePurchase}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Yes'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Validation Warning Dialog */}
      <Dialog
        open={!!validationWarning}
        onOpenChange={() => setValidationWarning(null)}
        className="max-w-sm p-5 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-lg"
      >
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Notice</h3>
          <p className="text-xs text-muted-foreground">{validationWarning}</p>
          <div className="pt-2 flex justify-center">
            <Button size="sm" onClick={() => setValidationWarning(null)} className="px-6">
              OK
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
