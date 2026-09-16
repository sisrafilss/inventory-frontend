'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { X, Plus, Trash2, Undo2, Camera } from 'lucide-react';
import { CameraScannerModal } from '@/components/ui/camera-scanner-modal';

interface CreatePurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePurchaseReturnModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePurchaseReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [refundType, setRefundType] = useState<'CASH' | 'CREDIT_ADJUSTMENT'>('CASH');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [cameraScanOpen, setCameraScanOpen] = useState(false);
  const [items, setItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([{ productId: '', quantity: 1, unitPrice: 0 }]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const [suppRes, whRes, prodRes] = await Promise.all([
        api.get<any>('/parties/suppliers'),
        api.get<any>('/warehouses'),
        api.get<any>('/products?limit=200'),
      ]);
      setSuppliers(suppRes.data || []);
      setWarehouses(whRes.data || []);
      setProducts(prodRes.data || []);
      if (whRes.data && whRes.data.length > 0) {
        setWarehouseId(whRes.data[0].id);
      }
    } catch (err: any) {
      toast.error('Failed to load dropdown options');
    }
  };

  const handleProductChange = (index: number, pId: string) => {
    const selectedProd = products.find((p) => p.id === pId);
    const updated = [...items];
    updated[index].productId = pId;
    if (selectedProd) {
      updated[index].unitPrice = Number(selectedProd.costPrice || selectedProd.dpRate || 0);
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((it) => !it.productId || it.quantity <= 0)) {
      toast.error('Please select valid products and positive quantities.');
      return;
    }

    const subtotal = calculateSubtotal();
    const finalRefund = refundAmount > 0 ? refundAmount : subtotal;

    setLoading(true);
    try {
      await api.post('/returns/purchases', {
        supplierId: supplierId || null,
        warehouseId: warehouseId || null,
        refundType,
        refundAmount: finalRefund,
        reason: reason || null,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      toast.success('Purchase Return recorded successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record purchase return');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f0f4f8] dark:bg-slate-900 border border-[#800000] dark:border-red-900 rounded-xs shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden select-none">
        {/* Banner Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#800000] dark:bg-red-950 text-white border-b border-red-950">
          <div className="flex items-center gap-2">
            <Undo2 className="w-4 h-4 text-white" />
            <h2 className="text-xs font-bold tracking-wide uppercase">New Purchase Return (Return to Supplier)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Supplier (Optional)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-700 rounded-xs font-medium"
              >
                <option value="">General Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''} - Due: ৳{s.currentDue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-700 rounded-xs font-medium"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Refund Method
              </label>
              <select
                value={refundType}
                onChange={(e) => setRefundType(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-700 rounded-xs font-bold text-amber-800 dark:text-amber-300"
              >
                <option value="CASH">Cash Received</option>
                <option value="CREDIT_ADJUSTMENT">Reduce Supplier Due</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="border border-neutral-400 dark:border-slate-700 rounded-xs p-3 bg-white dark:bg-slate-850 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                Products Returned to Supplier
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCameraScanOpen(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" /> Scan Barcode
                </button>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-[#800000] hover:bg-rose-900 text-white font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 bg-[#eaf1f8] dark:bg-slate-800 p-2 border border-neutral-300 dark:border-slate-700 rounded-xs"
                >
                  <div className="flex-1 min-w-[200px] w-full">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-700 rounded-xs font-medium"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}{p.barcode ? ` | ${p.barcode}` : ''}) - Stock: {p.quantity} {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-700 rounded-xs font-bold text-center"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Unit Cost"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-700 rounded-xs font-bold text-right"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-28 text-right font-mono font-bold text-amber-900 dark:text-amber-300">
                    ৳{(item.quantity * item.unitPrice || 0).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-red-600 hover:text-red-800 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reason & Subtotal Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                Return Reason
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Damaged shipment, wrong specification product"
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-700 rounded-xs"
              />
            </div>

            <div className="bg-[#b0c8de]/40 dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-700 rounded-xs flex flex-col justify-between">
              <div className="flex justify-between items-center font-bold text-neutral-700 dark:text-neutral-300">
                <span>Subtotal Items Total:</span>
                <span className="font-mono">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-extrabold text-amber-900 dark:text-amber-300 pt-1 border-t border-neutral-300 dark:border-slate-700 mt-1">
                <span>Total Refund Value:</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={refundAmount || subtotal}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right font-mono font-bold text-amber-900 bg-white border border-neutral-400 px-2 py-0.5 rounded-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-300 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 rounded-xs font-bold hover:bg-neutral-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-7 px-4 bg-[#800000] hover:bg-red-900 text-white font-bold rounded-xs cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Confirm Purchase Return'}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Live Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={cameraScanOpen}
        onClose={() => setCameraScanOpen(false)}
        onScan={(scannedBarcode) => {
          const prod = products.find(
            (p) =>
              p.barcode?.toLowerCase() === scannedBarcode.toLowerCase() ||
              p.sku.toLowerCase() === scannedBarcode.toLowerCase()
          );
          if (prod) {
            const existingIdx = items.findIndex((it) => it.productId === prod.id);
            if (existingIdx >= 0) {
              const updated = [...items];
              updated[existingIdx].quantity += 1;
              setItems(updated);
            } else if (items.length === 1 && !items[0].productId) {
              setItems([
                {
                  productId: prod.id,
                  quantity: 1,
                  unitPrice: Number(prod.costPrice || prod.dpRate || 0),
                },
              ]);
            } else {
              setItems([
                ...items,
                {
                  productId: prod.id,
                  quantity: 1,
                  unitPrice: Number(prod.costPrice || prod.dpRate || 0),
                },
              ]);
            }
            toast.success(`Scanned and added: ${prod.name}`);
          } else {
            toast.error(`No product found with Barcode/SKU: ${scannedBarcode}`);
          }
        }}
      />
    </div>
  );
}
