'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Product, Customer, Warehouse, Sale } from '@/lib/types';
import { api } from '@/lib/api/client';
import { InvoiceMemoModal, MemoSale } from './invoice-memo-modal';

export interface ManualSaleLineItem {
  id: string;
  productId: string;
  code: string;
  name: string;
  type: string;
  quantity: number;
  rate: number;
  amount: number;
  purchaseRate: number;
  purchaseAmount: number;
  profit: number;
}

interface SaleManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: () => void;
}

export function SaleManualModal({
  open,
  onOpenChange,
  onSaveSuccess,
}: SaleManualModalProps) {
  // Current Date
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Top Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CUSTOMER'>('CASH');
  const [memoPreview, setMemoPreview] = useState<boolean>(true);

  // Customer State
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [customerId, setCustomerId] = useState('0');
  const [customerName, setCustomerName] = useState('Cash Party');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDues, setCustomerDues] = useState('0.00');

  // Item Form Fields
  const [itemCode, setItemCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemName, setItemName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [dpRate, setDpRate] = useState<number | string>('');
  const [commission, setCommission] = useState<number | string>('');
  const [purchaseRate, setPurchaseRate] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number | string>('');
  const [itemType, setItemType] = useState('Pieces');

  // Calculated single item amount
  const itemQtyNum = parseFloat(String(quantity)) || 0;
  const itemRateNum = parseFloat(String(saleRate)) || 0;
  const currentItemAmount = Number((itemQtyNum * itemRateNum).toFixed(2));

  // Loading & Focus States
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [activeFocusedField, setActiveFocusedField] = useState<string>('itemCode');

  // Table Items
  const [lineItems, setLineItems] = useState<ManualSaleLineItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Totals & Discounts
  const [paidAmount, setPaidAmount] = useState<number | string>('0.00');
  const [paidTouched, setPaidTouched] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number | string>('0.00');

  // Dialogs
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Memo Modal
  const [savedSaleForMemo, setSavedSaleForMemo] = useState<MemoSale | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);

  // Refs
  const codeInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Generate Invoice Number and load Customers/Warehouses on open
  useEffect(() => {
    if (open) {
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);

      api.get<Customer[]>('/parties/customers')
        .then((res) => {
          if (res.data) setCustomersList(res.data);
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
    }
  }, [open]);

  // Debounced Item Code Search (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(itemCode.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [itemCode]);

  // Query product when debouncedCode changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedCode.toUpperCase();
    if (!code) {
      setCodeWarning(null);
      setCodeSuccess(false);
      setIsSearchingProduct(false);
      return;
    }

    if (selectedProduct && selectedProduct.sku.toUpperCase() === code) {
      return;
    }

    let active = true;
    setIsSearchingProduct(true);
    setCodeWarning(null);
    setCodeSuccess(false);

    api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          setSelectedProduct(p);
          setItemName(p.name);
          setCompanyName(p.company?.name || '—');
          const dp = p.dpRate ? Number(p.dpRate) : (p.costPrice ? Number(p.costPrice) : 0);
          setDpRate(dp > 0 ? String(dp) : '0');
          const comm = p.commissionPercent ? Number(p.commissionPercent) : 0;
          setCommission(comm > 0 ? String(comm) : '0');
          const pCost = p.costPrice ? Number(p.costPrice) : dp;
          setPurchaseRate(pCost > 0 ? String(pCost) : '0');
          setAvailableStock(p.quantity || 0);
          setItemType(p.unit || 'Pieces');
          setSaleRate(p.sellingPrice ? String(p.sellingPrice) : '0');
          setQuantity('1');
          setCodeSuccess(true);
          setCodeWarning(null);
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
        setAvailableStock(0);
        setSaleRate('');
        setQuantity('');
        setCodeSuccess(false);
        setCodeWarning(`Product "${code}" does not exist in database.`);
      })
      .finally(() => {
        if (active) setIsSearchingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCode, open]);

  // Customer Selection Helper
  const handleSelectCustomer = (cId: string) => {
    setCustomerId(cId);
    const c = customersList.find((cust) => cust.id === cId);
    if (c) {
      setCustomerName(c.name);
      setCustomerAddress(c.address || '');
      setCustomerPhone(c.phone || '');
      const due = c.currentDue ?? c.openingDue ?? 0;
      setCustomerDues(Number(due).toFixed(2));
    } else {
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCustomerDues('0.00');
    }
  };

  // Add Item to Table
  const handleAddItem = () => {
    if (!selectedProduct) {
      setValidationWarning('Please enter an Item Code and select a product first.');
      return;
    }

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty <= 0) {
      setValidationWarning('Quantity must be greater than 0.');
      setTimeout(() => qtyInputRef.current?.focus(), 50);
      return;
    }

    const rate = parseFloat(String(saleRate));
    if (isNaN(rate) || rate < 0) {
      setValidationWarning('Please enter a valid Sale Rate.');
      return;
    }

    // Check existing quantity in table
    const existingInTable = lineItems
      .filter((i) => i.productId === selectedProduct.id)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (existingInTable + qty > availableStock) {
      setValidationWarning(
        `Insufficient stock! Available: ${availableStock}, In Invoice: ${existingInTable + qty}.`
      );
      return;
    }

    const pRate = parseFloat(String(purchaseRate)) || 0;
    const amount = Number((qty * rate).toFixed(2));
    const purchaseAmount = Number((qty * pRate).toFixed(2));
    const profit = Number((amount - purchaseAmount).toFixed(2));

    const newItem: ManualSaleLineItem = {
      id: Math.random().toString(),
      productId: selectedProduct.id,
      code: selectedProduct.sku,
      name: selectedProduct.name,
      type: itemType,
      quantity: qty,
      rate,
      amount,
      purchaseRate: pRate,
      purchaseAmount,
      profit,
    };

    setLineItems((prev) => [...prev, newItem]);

    // Reset item form fields
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setQuantity('');
    setAvailableStock(0);
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Remove Item from Table
  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedRowId === id) setSelectedRowId(null);
  };

  // Delete Selected Row via Action button
  const handleDeleteSelectedRow = () => {
    if (!selectedRowId) {
      setValidationWarning('Please select an item row from the table below to delete.');
      return;
    }
    handleRemoveItem(selectedRowId);
  };

  // Refresh / Clear All
  const handleRefresh = () => {
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setCompanyName('');
    setDpRate('');
    setCommission('');
    setPurchaseRate('');
    setQuantity('');
    setAvailableStock(0);
    setSaleRate('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setLineItems([]);
    setSelectedRowId(null);
    setPaidAmount('0.00');
    setPaidTouched(false);
    setDiscountAmount('0.00');
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setActiveFocusedField('itemCode');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Totals Calculations
  const totalAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);
  const totalPurchaseCost = lineItems.reduce((acc, item) => acc + item.purchaseAmount, 0);
  const discountVal = Math.max(0, parseFloat(String(discountAmount)) || 0);
  const netAmount = Math.max(0, totalAmount - discountVal);
  const totalProfit = Number((netAmount - totalPurchaseCost).toFixed(2));

  // Paid amount calculation: in cash mode defaults to netAmount
  const effectivePaid =
    paymentMode === 'CASH' && !paidTouched
      ? netAmount
      : Math.max(0, parseFloat(String(paidAmount)) || 0);

  const currentDues = Number(Math.max(0, netAmount - effectivePaid).toFixed(2));

  // Save Validation & Trigger
  const handleInitiateSave = () => {
    if (lineItems.length === 0) {
      setValidationWarning('Please add at least one item to the sale invoice before saving.');
      return;
    }

    if (paymentMode === 'CUSTOMER' && (!customerId || customerId === '0')) {
      setValidationWarning('Please select a valid customer for credit / customer sale.');
      return;
    }

    setShowConfirmSave(true);
  };

  // Save Execute to Database
  const handleExecuteSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        referenceNumber: invoiceNumber.trim() || undefined,
        paymentType: paymentMode === 'CASH' ? ('CASH' as const) : ('CREDIT' as const),
        customerId: paymentMode === 'CUSTOMER' && customerId !== '0' ? customerId : undefined,
        customerName: paymentMode === 'CASH' ? (customerName || 'Cash Party') : undefined,
        customerPhone: customerPhone || undefined,
        warehouseId: defaultWarehouseId || undefined,
        discount: discountVal,
        paidAmount: effectivePaid,
        items: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.rate,
          purchaseCost: item.purchaseRate,
        })),
      };

      const res = await api.post<Sale>('/sales', payload);
      const created = res.data;

      setShowConfirmSave(false);

      // Prepare memo data
      if (memoPreview) {
        const memoData: MemoSale = {
          id: created.id,
          referenceNumber: created.referenceNumber || invoiceNumber,
          totalAmount: Number(created.totalAmount),
          discount: Number(created.discount || discountVal),
          netAmount: Number(created.netAmount || netAmount),
          paidAmount: Number(created.paidAmount || effectivePaid),
          dueAmount: Number(created.dueAmount || currentDues),
          paymentType: paymentMode === 'CASH' ? 'CASH' : 'CREDIT',
          totalPurchaseCost,
          profit: totalProfit,
          customerName: customerName || 'Cash Party',
          customerPhone: customerPhone || undefined,
          customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            currentDue: Number(customerDues),
          },
          items: lineItems.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.rate,
            lineTotal: item.amount,
            product: {
              name: item.name,
              sku: item.code,
              unit: item.type,
            },
          })),
        };
        setSavedSaleForMemo(memoData);
        setShowMemoModal(true);
      } else {
        alert('Sale saved successfully!');
        onOpenChange(false);
      }

      handleRefresh();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to save sale.');
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
        className="p-0 max-w-6xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🍎</span>
            <span className="text-white font-bold text-sm tracking-wide">Sale Manual</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none absolute left-1/2 -translate-x-1/2">
            Sale Manual
          </h2>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-3 sm:p-4 space-y-3 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Top Form Area (3 Columns: Item Details on Left, Financials in Center, Customer & Options on Right with generous gap) */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-y-3 gap-x-4 lg:gap-x-6">
            {/* Column 1: Item Details Inputs & Action Buttons (w-[420px]) */}
            <div className="w-full lg:w-[420px] shrink-0 space-y-1.5">
              {/* Row 1: Invoice Number */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Invoice
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Auto"
                  className="w-36 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none"
                />
              </div>

              {/* Row 2: Item Code + View Button */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center">
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={itemCode}
                        onChange={(e) => {
                          setItemCode(e.target.value.toUpperCase());
                          if (codeWarning) setCodeWarning(null);
                        }}
                        onFocus={() => setActiveFocusedField('itemCode')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setDebouncedCode(itemCode.trim());
                          }
                        }}
                        placeholder="e.g. 937095"
                        disabled={isSaving}
                        className="w-32 h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
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
                      className="h-6 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                </div>

                {/* Aligned Error Warning */}
                {codeWarning && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-20 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeWarning}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: Item Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  readOnly
                  placeholder="Product name"
                  className="w-[320px] h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none"
                />
              </div>

              {/* Row 4: Quantity & Stock */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={() => setActiveFocusedField('quantity')}
                    onBlur={() => setActiveFocusedField('')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    placeholder="0"
                    className={`w-24 h-6 px-2 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none transition-colors ${
                      activeFocusedField === 'quantity'
                        ? 'bg-[#ffff00] text-black ring-1 ring-amber-500'
                        : 'bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100'
                    }`}
                  />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 w-10 text-center">Stock</span>
                  <input
                    type="text"
                    readOnly
                    value={availableStock}
                    className="w-20 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Sale Rate & Type */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Sale Rate
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={saleRate}
                    onChange={(e) => setSaleRate(e.target.value)}
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 w-10 text-center">Type</span>
                  <input
                    type="text"
                    readOnly
                    value={itemType}
                    className="w-20 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Amount */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentItemAmount > 0 ? currentItemAmount.toFixed(2) : ''}
                  placeholder="0.00"
                  className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                />
              </div>

              {/* Row 7: Action Buttons Row (Refresh, Add, Save, Delete, Close) */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSave}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedRow}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="w-[74px] h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Column 2: Financials (Company, DP Rate, Commission, Purchase Rate) */}
            <div className="w-full lg:w-[220px] shrink-0 space-y-1.5 lg:ml-2">
              {/* Row 1: Spacer corresponding to Invoice */}
              <div className="h-6 hidden lg:block" />

              {/* Row 2: Company */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  placeholder="—"
                  className="w-32 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none"
                />
              </div>

              {/* Row 3: DP Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  DP Rate
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={dpRate}
                    readOnly
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none"
                  />
                  <span className="text-xs font-semibold">Tk</span>
                </div>
              </div>

              {/* Row 4: Commission */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Commission
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={commission}
                    readOnly
                    placeholder="0"
                    className="w-14 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-center focus:outline-none"
                  />
                  <span className="text-xs font-semibold">%</span>
                </div>
              </div>

              {/* Row 5: Purchase Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-20 text-right shrink-0">
                  Purchase Rate
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={purchaseRate}
                    readOnly
                    placeholder="0.00"
                    className="w-24 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                  />
                  <span className="text-xs font-semibold">Tk</span>
                </div>
              </div>
            </div>

            {/* Column 3: Customer / Party Info & Date & Options (w-[380px] with guaranteed separation) */}
            <div className="w-full lg:w-[380px] shrink-0 space-y-1.5 lg:ml-auto">
              {/* Row 1: Date in top right */}
              <div className="flex justify-end h-6 items-center">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-2 py-0.5 font-mono text-xs shadow-sm">
                  <span className="font-semibold">{currentDate}</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-neutral-500" />
                </div>
              </div>

              {/* Row 2: Radios & Memo Preview Checkbox */}
              <div className="flex items-center justify-between gap-3 h-6">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      name="salePaymentMode"
                      checked={paymentMode === 'CASH'}
                      onChange={() => {
                        setPaymentMode('CASH');
                        setCustomerId('0');
                        setCustomerName('Cash Party');
                        setCustomerAddress('');
                        setCustomerPhone('');
                        setCustomerDues('0.00');
                        setPaidTouched(false);
                      }}
                      className="accent-emerald-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      name="salePaymentMode"
                      checked={paymentMode === 'CUSTOMER'}
                      onChange={() => {
                        setPaymentMode('CUSTOMER');
                        if (customersList.length > 0) {
                          handleSelectCustomer(customersList[0].id);
                        } else {
                          setCustomerId('');
                          setCustomerName('');
                          setCustomerAddress('');
                          setCustomerPhone('');
                          setCustomerDues('0.00');
                        }
                        setPaidTouched(true);
                        setPaidAmount('0.00');
                      }}
                      className="accent-emerald-700 w-4 h-4 cursor-pointer"
                    />
                    <span>Customer</span>
                  </label>
                </div>

                {/* Memo Preview Checkbox in Bold Red */}
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-red-600 dark:text-red-400">
                  <input
                    type="checkbox"
                    checked={memoPreview}
                    onChange={(e) => setMemoPreview(e.target.checked)}
                    className="accent-red-600 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Memo Preview</span>
                </label>
              </div>

              {/* Row 3: Customer ID */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Customer ID
                </label>
                {paymentMode === 'CUSTOMER' && customersList.length > 0 ? (
                  <select
                    value={customerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="flex-1 h-6 px-1.5 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none"
                  >
                    <option value="">Select Customer</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={paymentMode === 'CASH'}
                    className="w-24 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                  />
                )}
              </div>

              {/* Row 4: Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={paymentMode === 'CASH'}
                  placeholder="Customer Name"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 5: Address */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={paymentMode === 'CASH'}
                  placeholder="Address"
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 6: Phone No */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Phone No
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={paymentMode === 'CASH'}
                  placeholder="017..."
                  className="flex-1 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 focus:outline-none disabled:opacity-75"
                />
              </div>

              {/* Row 7: Dues */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right shrink-0">
                  Dues
                </label>
                <input
                  type="text"
                  value={customerDues}
                  readOnly
                  className="w-28 h-6 px-2 bg-white/80 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Middle Table Grid (SN | Code | Item Name | Type | Quantity | Rate | Amount | Action | P_Rate | P_Amount | Cm/Profit) */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner">
            <div className="max-h-52 sm:max-h-56 overflow-y-auto overflow-x-auto min-h-[140px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-10 text-center font-bold">
                      SN
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 font-bold">
                      Code
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[180px] font-bold">
                      Item Name
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 font-bold">
                      Type
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-20 text-right font-bold">
                      Quantity
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      Rate
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      Amount
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-16 text-center font-bold">
                      Action
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      P_Rate
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      P_Amount
                    </th>
                    <th className="py-1 px-2 text-right font-bold w-24">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-neutral-500 font-medium italic bg-white dark:bg-slate-900">
                        No sale items added. Type product code above and click Add.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, idx) => {
                      const isSelected = selectedRowId === item.id;
                      const isCyan = idx % 2 === 1;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedRowId(item.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-500 text-white font-semibold'
                              : isCyan
                              ? 'bg-[#e0f7fa] dark:bg-cyan-950/40 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800'
                              : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-sky-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono">
                            {item.code}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">
                            {item.name}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700">
                            {item.type}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">
                            {item.quantity}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">
                            {item.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold">
                            {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className={`underline font-semibold ${
                                isSelected ? 'text-white hover:text-red-200' : 'text-blue-600 hover:text-red-600'
                              }`}
                            >
                              Delete
                            </button>
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right">
                            {item.purchaseRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-semibold">
                            {item.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-0.5 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {item.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="flex-1 min-h-[50px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>

          {/* Bottom Summary Area (Paid, Current Dues | Total, Discount, Net Amount | Purchase Cost, Gross Profit) */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
            {/* Left Section: Paid & Current Dues */}
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
                  value={currentDues.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-32 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>

            {/* Middle Section: Total, Discount, Net Amount */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="flex items-center justify-end gap-3">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-24 text-right">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  value={totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  value={netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                />
              </div>
            </div>

            {/* Far Right Section: Cost & Profit */}
            <div className="space-y-1.5 w-full sm:w-auto">
              {/* Purchase Cost */}
              <div className="flex items-center justify-end gap-2">
                <input
                  type="text"
                  readOnly
                  value={totalPurchaseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/80 dark:bg-slate-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                  title="Total Purchase Cost"
                />
              </div>

              {/* Gross Profit */}
              <div className="flex items-center justify-end gap-2">
                <input
                  type="text"
                  readOnly
                  value={totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 text-right font-bold"
                  title="Net Profit"
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog (Screenshot 5) */}
      <Dialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        closeOnBackdropClick={!isSaving}
        className="max-w-sm p-5 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-sm"
      >
        <div className="space-y-4">
          <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 border-b pb-1">
            Confirmation
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ?
            </div>
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              Do you want to save the information?
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={handleExecuteSave}
              disabled={isSaving}
              className="min-w-[70px] h-7 bg-white hover:bg-neutral-100 text-black border border-neutral-400 text-xs font-semibold focus:ring-1 focus:ring-blue-500 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirmSave(false)}
              disabled={isSaving}
              className="min-w-[70px] h-7 text-xs font-semibold"
            >
              No
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Validation Notice Dialog */}
      <Dialog
        open={!!validationWarning}
        onOpenChange={() => setValidationWarning(null)}
        className="max-w-sm p-5 bg-white dark:bg-neutral-900 border border-border shadow-2xl rounded-sm"
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

      {/* Memo Preview Modal */}
      {savedSaleForMemo && (
        <InvoiceMemoModal
          sale={savedSaleForMemo}
          open={showMemoModal}
          onOpenChange={(isOpen) => {
            setShowMemoModal(isOpen);
            if (!isOpen) {
              setSavedSaleForMemo(null);
            }
          }}
        />
      )}
    </>
  );
}
