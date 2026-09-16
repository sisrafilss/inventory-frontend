'use client';

import React from 'react';
import { X, Printer, RotateCcw, Undo2, Calendar, User, Building2, Warehouse } from 'lucide-react';

interface ViewReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'sales' | 'purchase';
}

export function ViewReturnModal({ isOpen, onClose, data, type }: ViewReturnModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSales = type === 'sales';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 text-white ${isSales ? 'bg-[#004d00]' : 'bg-[#8b0000]'}`}>
          <div className="flex items-center gap-2">
            {isSales ? <RotateCcw className="w-5 h-5 text-emerald-300" /> : <Undo2 className="w-5 h-5 text-amber-300" />}
            <h2 className="text-sm font-bold tracking-wide">
              {isSales ? 'Sales Return Voucher' : 'Purchase Return Voucher'} - {data.returnNumber}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 print:p-0">
          {/* Top Info */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded uppercase mb-1 ${isSales ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}`}>
                {isSales ? 'Customer Sales Return' : 'Supplier Purchase Return'}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {data.returnNumber}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{isSales ? 'Customer:' : 'Supplier:'}</span>
                <span className="font-bold">
                  {isSales ? data.customer?.name || 'Walk-in Customer' : data.supplier?.name || 'General Supplier'}
                </span>
              </div>
              {data.warehouse && (
                <div className="flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Warehouse:</span>
                  <span>{data.warehouse.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Refund Method:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {data.refundType === 'CREDIT_ADJUSTMENT' ? 'Due Adjustment' : 'Cash Refund'}
                </span>
              </div>
            </div>
          </div>

          {/* Reason if available */}
          {data.reason && (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Return Reason: </span>
              <span className="text-slate-600 dark:text-slate-400">{data.reason}</span>
            </div>
          )}

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Returned Items
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5 text-center">Returned Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {data.items?.map((item: any, i: number) => (
                    <tr key={item.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-semibold">
                        {item.product?.name}
                        {item.product?.sku && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            SKU: {item.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {Number(item.quantity).toFixed(2)} {item.product?.unit || ''}
                      </td>
                      <td className="p-2.5 text-right">৳{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold">
                        ৳{Number(item.lineTotal || item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700 rounded">
              <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                <span>Items Subtotal:</span>
                <span>৳{Number(data.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1.5 border-t border-slate-300 dark:border-slate-700">
                <span>Total Refund Amount:</span>
                <span className={isSales ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  ৳{Number(data.refundAmount || data.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <span>Processed by: {data.createdBy?.name || 'System Admin'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
