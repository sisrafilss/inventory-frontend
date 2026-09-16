'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { X, Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';

interface CreateSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSalesReturnModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSalesReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [refundType, setRefundType] = useState<'CASH' | 'CREDIT_ADJUSTMENT'>('CASH');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
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
      const [custRes, whRes, prodRes] = await Promise.all([
        api.get<any>('/parties/customers'),
        api.get<any>('/warehouses'),
        api.get<any>('/products?limit=200'),
      ]);
      setCustomers(custRes.data || []);
      setWarehouses(whRes.data || []);
      setProducts(prodRes.data || []);
      if (whRes.data && whRes.data.length > 0) {
        setWarehouseId(whRes.data[0].id);
      }
    } catch (err: any) {
      toast.error('Failed to load initial dropdown data');
    }
  };

  const handleProductChange = (index: number, pId: string) => {
    const selectedProd = products.find((p) => p.id === pId);
    const updated = [...items];
    updated[index].productId = pId;
    if (selectedProd) {
      updated[index].unitPrice = Number(selectedProd.sellingPrice || selectedProd.dpRate || 0);
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
      toast.error('Please select valid products and positive quantities for all item rows.');
      return;
    }

    const subtotal = calculateSubtotal();
    const finalRefund = refundAmount > 0 ? refundAmount : subtotal;

    setLoading(true);
    try {
      await api.post('/returns/sales', {
        customerId: customerId || null,
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

      toast.success('Sales Return processed successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process sales return');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#004d00] text-white">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-300" />
            <h2 className="text-sm font-bold tracking-wide">New Sales Return (Customer Return)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Customer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer (Optional)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Walk-in Customer / Generic</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} - Due: ৳{c.currentDue}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receiving Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Refund Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refund Method
              </label>
              <select
                value={refundType}
                onChange={(e) => setRefundType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500 font-semibold text-emerald-700 dark:text-emerald-400"
              >
                <option value="CASH">Cash Refund</option>
                <option value="CREDIT_ADJUSTMENT">Adjust Customer Due Balance</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded p-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Returned Products
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <div className="flex-1 min-w-[200px] w-full">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      required
                    >
                      <option value="">Select Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Stock: {p.quantity} {p.unit}
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
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-28 text-right text-xs font-bold text-slate-700 dark:text-slate-300">
                    ৳{(item.quantity * item.unitPrice || 0).toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reason & Refund Amount Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Return
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Defective item, customer changed mind, wrong size"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
              />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                <span>Items Total:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ৳{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Actual Refund Amount:
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={refundAmount || subtotal}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 px-2 py-1 rounded text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                * Stock will be restored back to warehouse.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#006400] hover:bg-[#004d00] rounded shadow transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Sales Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
