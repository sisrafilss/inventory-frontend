'use client';
import { toast } from 'sonner';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { api } from '@/lib/api/client';

interface SaleRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductCode?: string;
  onSaveSuccess?: () => void;
}

export function SaleRateModal({
  open,
  onOpenChange,
  initialProductCode,
  onSaveSuccess,
}: SaleRateModalProps) {
  // Current Date
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Form Fields
  const [systemId, setSystemId] = useState('');
  const [itemCode, setItemCode] = useState(initialProductCode || '');
  const [debouncedCode, setDebouncedCode] = useState(initialProductCode || '');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemName, setItemName] = useState('');
  const [purchaseRate, setPurchaseRate] = useState<number | string>('');
  const [saleRate, setSaleRate] = useState<number | string>('');

  // States
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState(false);

  // Table products list
  const [tableProducts, setTableProducts] = useState<Product[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Dialogs
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Refs
  const codeInputRef = useRef<HTMLInputElement>(null);
  const saleRateInputRef = useRef<HTMLInputElement>(null);

  // Load products list for the bottom grid
  const fetchTableProducts = async () => {
    try {
      setLoadingTable(true);
      const res = await api.get<Product[]>('/products', { page: 1, limit: 50 });
      setTableProducts(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTableProducts();
      if (initialProductCode) {
        setItemCode(initialProductCode);
        setDebouncedCode(initialProductCode);
      }
    }
  }, [open, initialProductCode]);

  // Debounce Item Code while typing (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(itemCode.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [itemCode]);

  // Search product when debouncedCode changes
  useEffect(() => {
    if (!open) return;
    const code = debouncedCode.toUpperCase();
    if (!code) {
      setCodeWarning(null);
      setCodeSuccess(false);
      setIsSearching(false);
      return;
    }

    // Skip if already matching current product
    if (selectedProduct && selectedProduct.sku.toUpperCase() === code) {
      return;
    }

    let active = true;
    setIsSearching(true);
    setCodeWarning(null);
    setCodeSuccess(false);

    api.get<Product>(`/products/by-code/${encodeURIComponent(code)}`)
      .then((res) => {
        if (!active) return;
        const p = res.data;
        if (p) {
          applySelectedProduct(p);
          setCodeSuccess(true);
          setCodeWarning(null);
          setTimeout(() => saleRateInputRef.current?.focus(), 80);
        }
      })
      .catch(() => {
        if (!active) return;
        setSelectedProduct(null);
        setItemName('');
        setPurchaseRate('');
        setSaleRate('');
        setSystemId('');
        setCodeSuccess(false);
        setCodeWarning(`Product "${code}" does not exist in database.`);
      })
      .finally(() => {
        if (active) setIsSearching(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedCode, open]);

  // Helper to populate form from product
  const applySelectedProduct = (p: Product) => {
    setSelectedProduct(p);
    setItemCode(p.sku);
    setDebouncedCode(p.sku);
    setItemName(p.name);
    setPurchaseRate(p.costPrice ? String(p.costPrice) : (p.dpRate ? String(p.dpRate) : '0'));
    setSaleRate(p.sellingPrice ? String(p.sellingPrice) : '');
    setSystemId(p.id.slice(0, 8).toUpperCase());
    setCodeWarning(null);
    setCodeSuccess(true);
  };

  // Manual search button trigger
  const handleManualSearch = () => {
    const code = itemCode.trim();
    if (!code) {
      setValidationWarning('Please enter an Item Code to search.');
      return;
    }
    setDebouncedCode(code);
  };

  // Refresh form
  const handleRefresh = () => {
    setItemCode('');
    setDebouncedCode('');
    setSelectedProduct(null);
    setItemName('');
    setPurchaseRate('');
    setSaleRate('');
    setSystemId('');
    setCodeWarning(null);
    setCodeSuccess(false);
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  // Save initiate
  const handleInitiateSave = () => {
    if (!selectedProduct) {
      setValidationWarning('Please search and select a product first.');
      return;
    }
    const rate = parseFloat(String(saleRate));
    if (isNaN(rate) || rate < 0) {
      setValidationWarning('Please enter a valid non-negative Sale Rate.');
      setTimeout(() => saleRateInputRef.current?.focus(), 50);
      return;
    }
    setShowConfirmSave(true);
  };

  // Save execute
  const handleExecuteSave = async () => {
    if (!selectedProduct) return;
    const rate = parseFloat(String(saleRate));
    setIsSaving(true);
    try {
      const res = await api.post<Product>('/products/sale-rate', {
        id: selectedProduct.id,
        code: selectedProduct.sku,
        saleRate: rate,
      });

      const updated = res.data;
      applySelectedProduct(updated);

      // Update table products in place
      setTableProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, sellingPrice: updated.sellingPrice } : item))
      );

      setShowConfirmSave(false);
      if (onSaveSuccess) onSaveSuccess();
      toast.success(`Sale rate for "${updated.name}" updated successfully to ${rate.toFixed(2)}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update sale rate.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Reset initiate
  const handleInitiateDelete = () => {
    if (!selectedProduct) {
      setValidationWarning('Please select a product first to reset its sale rate.');
      return;
    }
    setShowConfirmDelete(true);
  };

  // Delete / Reset execute (sets saleRate to 0)
  const handleExecuteDelete = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const res = await api.post<Product>('/products/sale-rate', {
        id: selectedProduct.id,
        code: selectedProduct.sku,
        saleRate: 0,
      });

      const updated = res.data;
      applySelectedProduct(updated);
      setSaleRate('0');

      setTableProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, sellingPrice: 0 } : item))
      );

      setShowConfirmDelete(false);
      if (onSaveSuccess) onSaveSuccess();
      toast.success(`Sale rate for "${updated.name}" reset to 0.00.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to reset sale rate.');
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
        className="p-0 max-w-4xl w-full border-2 border-[#800000] dark:border-rose-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Dark Green Banner Header with Drag Handle */}
        <div
          data-drag-handle
          title="Click and drag to move window"
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <h2 className="text-xl font-bold text-white tracking-wide pointer-events-none select-none">
            Sale Rate
          </h2>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 space-y-4 select-none text-xs text-neutral-900 dark:text-neutral-100">
          {/* Top Form Area (Form on Left, Action Buttons Stack on Right) */}
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
            {/* Left Form Fields */}
            <div className="space-y-2 flex-1 w-full max-w-lg">
              {/* System ID */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-28 text-right shrink-0">
                  System ID
                </label>
                <input
                  type="text"
                  value={systemId}
                  readOnly
                  placeholder="Auto"
                  className="w-36 h-6 px-2 bg-neutral-200/80 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Item Code + Search Button */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-28 text-right shrink-0">
                    Item Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <input
                        ref={codeInputRef}
                        type="text"
                        value={itemCode}
                        onChange={(e) => {
                          setItemCode(e.target.value.toUpperCase());
                          if (codeWarning) setCodeWarning(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManualSearch();
                          }
                        }}
                        placeholder="e.g. 937095"
                        disabled={isSaving}
                        className="w-36 h-6 px-2 pr-6 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                      />
                      {isSearching && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                      {!isSearching && codeSuccess && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-1.5 pointer-events-none" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSearch}
                      disabled={isSaving || isSearching}
                      className="h-6 px-5 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Warning message if code not found - perfectly aligned with inputs */}
                {codeWarning && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-28 shrink-0" />
                    <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeWarning}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-28 text-right shrink-0">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  readOnly
                  placeholder="Product name"
                  className="flex-1 h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-medium focus:outline-none cursor-default"
                />
              </div>

              {/* Purchase Rate */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-28 text-right shrink-0">
                  Purchase Rate
                </label>
                <input
                  type="text"
                  value={purchaseRate}
                  readOnly
                  placeholder="0.00"
                  className="w-36 h-6 px-2 bg-white/90 dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none cursor-default"
                />
              </div>

              {/* Sale Rate (Active Focus) */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-neutral-900 dark:text-neutral-200 w-28 text-right shrink-0">
                  Sale Rate
                </label>
                <input
                  ref={saleRateInputRef}
                  type="number"
                  step="0.01"
                  min="0"
                  value={saleRate}
                  onChange={(e) => setSaleRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInitiateSave();
                    }
                  }}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-36 h-6 px-2 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border border-neutral-400 dark:border-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Right Date & Action Buttons Stack */}
            <div className="flex flex-col items-end gap-3 w-full md:w-auto shrink-0">
              {/* Date Box */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 px-2 py-1 font-mono text-xs shadow-sm">
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Date</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentDate}</span>
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-500 ml-1" />
              </div>

              {/* Action Buttons Stack */}
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-32 justify-end pt-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isSaving}
                  className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleInitiateSave}
                  disabled={isSaving}
                  className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border-2 border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleInitiateDelete}
                  disabled={isSaving || !selectedProduct}
                  className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="w-full h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-900 dark:text-neutral-100 border border-[#b81b4c] dark:border-rose-500 font-bold text-xs tracking-wider shadow-sm transition-colors disabled:opacity-50"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Table Grid (SN | Code | Name | Date | Rate | System ID) */}
          <div className="border border-neutral-400 dark:border-slate-700 bg-[#9ca3af] dark:bg-slate-950 overflow-hidden shadow-inner mt-4">
            <div className="max-h-60 sm:max-h-64 overflow-y-auto overflow-x-auto min-h-[160px] bg-[#9ca3af] dark:bg-slate-950 flex flex-col">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs">
                  <tr>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-12 text-center font-bold">
                      SN
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-28 font-bold">
                      Code
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 min-w-[200px] font-bold">
                      Name
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-28 font-bold">
                      Date
                    </th>
                    <th className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 w-24 text-right font-bold">
                      Rate
                    </th>
                    <th className="py-1 px-2 font-bold w-28">
                      System ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900">
                  {loadingTable ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500 italic">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-emerald-600" />
                        Loading products...
                      </td>
                    </tr>
                  ) : tableProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-neutral-500 italic">
                        No products available.
                      </td>
                    </tr>
                  ) : (
                    tableProducts.map((p, idx) => {
                      const isSelected = selectedProduct?.id === p.id;
                      const isCyan = idx % 2 === 1;
                      const formattedDate = p.updatedAt
                        ? new Date(p.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')
                        : currentDate;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => applySelectedProduct(p)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-950/50 font-semibold'
                              : isCyan
                              ? 'bg-[#e0f7fa] dark:bg-cyan-950/40 hover:bg-sky-100 dark:hover:bg-slate-800'
                              : 'bg-white dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800'
                          } text-neutral-900 dark:text-neutral-100`}
                          title="Click to select this item"
                        >
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono font-semibold">
                            {p.sku}
                          </td>
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700">
                            {p.name}
                          </td>
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 font-mono">
                            {formattedDate}
                          </td>
                          <td className="py-1 px-2 border-r border-neutral-300 dark:border-slate-700 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            {Number(p.sellingPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-1 px-2 font-mono text-neutral-600 dark:text-neutral-400">
                            {p.id.slice(0, 8).toUpperCase()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {/* Grey backdrop filling remaining space */}
              <div className="flex-1 min-h-[60px] bg-[#9ca3af] dark:bg-slate-950 w-full" />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        title="Confirm Save"
        description="Confirm updating the sale rate for this product in the catalog."
        onConfirm={handleExecuteSave}
        confirmText="Yes"
        cancelText="No"
        variant="success"
        isLoading={isSaving}
        loadingText="Saving..."
        details={[
          { label: 'Item Code:', value: selectedProduct?.sku || '' },
          { label: 'Product Name:', value: selectedProduct?.name || '' },
          { label: 'Purchase Rate:', value: `৳${Number(purchaseRate || 0).toFixed(2)}` },
          { label: 'New Sale Rate:', value: `৳${Number(saleRate || 0).toFixed(2)}`, color: 'text-emerald-700 dark:text-emerald-400' },
        ]}
      />

      {/* Delete / Reset Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDelete}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmDelete(isOpen)}
        title="Reset Sale Rate?"
        description={`Are you sure you want to reset the sale rate for "${selectedProduct?.name}" to 0.00?`}
        onConfirm={handleExecuteDelete}
        confirmText="Yes, Reset"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSaving}
        loadingText="Resetting..."
      />

      {/* Validation Warning Dialog */}
      <ConfirmDialog
        open={!!validationWarning}
        onOpenChange={() => setValidationWarning(null)}
        title="Notice"
        description={validationWarning}
        onConfirm={() => setValidationWarning(null)}
        confirmText="OK"
        cancelText=""
        variant="danger"
      />
    </>
  );
}
