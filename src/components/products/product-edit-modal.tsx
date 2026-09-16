'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  X,
  Package,
  Save,
  Loader2,
  Barcode,
  Camera,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Product, Category, Company } from '@/lib/types';
import { api } from '@/lib/api/client';
import { CameraScannerModal } from '@/components/ui/camera-scanner-modal';
import { calculateEffectivePackSize } from '@/lib/utils';
import { isPackagedUnit } from '@/lib/stock-utils';

export interface ProductEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: (product: Product) => void;
}

export function ProductEditModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductEditModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    companyId: '',
    unit: 'Pieces',
    packSize: 1,
    dpRate: 0,
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 10,
    description: '',
    isActive: true,
  });

  const [codeExistsWarning, setCodeExistsWarning] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeIsAvailable, setCodeIsAvailable] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Load categories and companies
  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Company[]>('/companies'),
    ])
      .then(([catRes, compRes]) => {
        if (!active) return;
        setCategories(catRes.data || []);
        setCompanies(compRes.data || []);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [open]);

  // Sync form state when product changes
  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        categoryId: product.categoryId || '',
        companyId: product.companyId || '',
        unit: product.unit || 'Pieces',
        packSize: Number(product.packSize) || 1,
        dpRate: Number(product.dpRate || 0),
        costPrice: Number(product.costPrice || 0),
        sellingPrice: Number(product.sellingPrice || 0),
        reorderLevel: Number(product.reorderLevel || 10),
        description: product.description || '',
        isActive: product.isActive !== false,
      });
      setCodeExistsWarning(null);
      setCodeIsAvailable(false);
      setIsCheckingCode(false);
      setShowConfirmSave(false);
    }
  }, [open, product]);

  // Code debounced check
  useEffect(() => {
    const trimmed = form.sku.trim();
    if (!trimmed || !product) {
      setCodeExistsWarning(null);
      return;
    }
    if (product.sku.trim().toLowerCase() === trimmed.toLowerCase()) {
      setCodeExistsWarning(null);
      setCodeIsAvailable(false);
      return;
    }

    let active = true;
    setIsCheckingCode(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get<{ exists: boolean; product: { name: string; sku: string } | null }>(
          `/products/check-code/${encodeURIComponent(trimmed)}`
        );
        if (!active) return;
        if (res.data?.exists) {
          setCodeExistsWarning(`Code "${trimmed}" is already used by "${res.data.product?.name}".`);
          setCodeIsAvailable(false);
        } else {
          setCodeExistsWarning(null);
          setCodeIsAvailable(true);
        }
      } catch {
        // ignore
      } finally {
        if (active) setIsCheckingCode(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.sku, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error('Item Code and Item Name are required.');
      return;
    }
    if (codeExistsWarning) {
      toast.error(`Cannot save: ${codeExistsWarning}`);
      return;
    }
    setShowConfirmSave(true);
  };

  const handleExecuteSave = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
      const effectivePackSize = calculateEffectivePackSize(form.unit, form.packSize);
      const res = await api.patch<Product>(`/products/${product.id}`, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode?.trim() || undefined,
        categoryId: form.categoryId || undefined,
        companyId: form.companyId || undefined,
        unit: form.unit,
        packSize: effectivePackSize,
        dpRate: Number(form.dpRate) || 0,
        costPrice: Number(form.costPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        reorderLevel: Number(form.reorderLevel) || 10,
        description: form.description?.trim() || undefined,
        isActive: form.isActive,
      });

      setShowConfirmSave(false);
      onOpenChange(false);
      toast.success('Product updated successfully!');
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !product) return null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => !isSaving && onOpenChange(val)}
        draggable={true}
        closeOnBackdropClick={false}
        zIndex="z-[85]"
        className="p-0 max-w-xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {/* Banner Header */}
        <div
          data-drag-handle
          className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing text-white"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-300" />
            <h2 className="text-sm font-bold tracking-wide">
              Edit Product: {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="space-y-2 bg-[#dbe7f3] dark:bg-slate-800/70 p-3.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner">
            {/* Item Code (SKU) */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Item Code <span className="text-rose-600">*</span>
              </label>
              <div className="col-span-9 relative">
                <input
                  type="text"
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  disabled={isSaving}
                  className="w-full h-7 px-2 pr-7 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                />
                <div className="absolute right-2 top-1.5 pointer-events-none">
                  {isCheckingCode ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                  ) : codeExistsWarning ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  ) : codeIsAvailable ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Barcode Field */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Barcode
              </label>
              <div className="col-span-9 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="Barcode string"
                    disabled={isSaving}
                    className="w-full h-7 px-2 pr-6 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                  />
                  <Barcode className="w-3.5 h-3.5 text-neutral-400 absolute right-1.5 top-1.5 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const generated = '894100' + Math.floor(100000 + Math.random() * 900000);
                    setForm({ ...form, barcode: generated });
                  }}
                  className="h-7 px-2 bg-white dark:bg-slate-800 border border-neutral-400 hover:bg-neutral-100 text-neutral-800 dark:text-neutral-200 font-bold text-[11px] rounded-xs cursor-pointer shadow-xs"
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="h-7 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Camera className="w-3 h-3" /> Scan
                </button>
              </div>
            </div>

            {/* Item Name */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Item Name <span className="text-rose-600">*</span>
              </label>
              <div className="col-span-9">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isSaving}
                  className="w-full h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                />
              </div>
            </div>

            {/* Company & Category */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Company
              </label>
              <div className="col-span-4">
                <select
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  disabled={isSaving}
                  className="w-full h-7 px-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                >
                  <option value="">-- No Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="col-span-2 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Category
              </label>
              <div className="col-span-3">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  disabled={isSaving}
                  className="w-full h-7 px-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                >
                  <option value="">-- None --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unit & Pack Size */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Unit
              </label>
              <div className="col-span-4">
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  disabled={isSaving}
                  className="w-full h-7 px-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                >
                  <option value="Pieces">Pieces</option>
                  <option value="Box">Box</option>
                  <option value="Carton">Carton</option>
                  <option value="Packet">Packet</option>
                  <option value="Kilograms">Kilograms</option>
                  <option value="Grams">Grams</option>
                  <option value="Liters">Liters</option>
                  <option value="Dozens">Dozens</option>
                </select>
              </div>

              <label className="col-span-2 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Pack Size
              </label>
              <div className="col-span-3">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={form.packSize}
                  onChange={(e) => setForm({ ...form, packSize: parseFloat(e.target.value) || 1 })}
                  disabled={isSaving || !isPackagedUnit(form.unit)}
                  className={`w-full h-7 px-2 font-mono font-bold text-xs border ${
                    !isPackagedUnit(form.unit)
                      ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 border-neutral-300 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 border-neutral-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#006400]'
                  }`}
                />
              </div>
            </div>

            {/* Rates Grid */}
            <div className="grid grid-cols-12 items-center gap-2 pt-1 border-t border-[#b2c8dc] dark:border-slate-700">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Purchase Rate ৳
              </label>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.costPrice === 0 ? '' : form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-full h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                />
              </div>

              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Sale Rate ৳
              </label>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.sellingPrice === 0 ? '' : form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-full h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                />
              </div>
            </div>

            {/* Reorder Level & Active */}
            <div className="grid grid-cols-12 items-center gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Reorder Level
              </label>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.reorderLevel}
                  onChange={(e) => setForm({ ...form, reorderLevel: parseFloat(e.target.value) || 0 })}
                  disabled={isSaving}
                  className="w-full h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-[#006400]"
                />
              </div>

              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                Status
              </label>
              <div className="col-span-3 flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="prod-is-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  disabled={isSaving}
                  className="w-4 h-4 text-[#006400] rounded cursor-pointer"
                />
                <label htmlFor="prod-is-active" className="font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  Active
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-12 items-start gap-2">
              <label className="col-span-3 text-right font-bold text-neutral-800 dark:text-neutral-200 pt-1">
                Description
              </label>
              <div className="col-span-9">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes or specifications"
                  disabled={isSaving}
                  className="w-full p-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-7 px-4 bg-[#006400] hover:bg-emerald-800 text-white font-bold text-xs rounded-xs border border-[#004d00] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={setShowConfirmSave}
        title="Confirm Update Product"
        description={`Are you sure you want to update specifications for "${form.name}"?`}
        onConfirm={handleExecuteSave}
        confirmText="Yes, Save"
        cancelText="No"
        variant="success"
        isLoading={isSaving}
        loadingText="Saving..."
      />

      {/* Camera Scanner Modal */}
      {scannerOpen && (
        <CameraScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(scannedCode) => {
            setForm((prev) => ({ ...prev, barcode: scannedCode }));
            setScannerOpen(false);
            toast.success(`Scanned: ${scannedCode}`);
          }}
        />
      )}
    </>
  );
}
