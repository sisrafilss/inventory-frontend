'use client';

import React from 'react';
import { X, Printer, RotateCcw, Undo2, Calendar, User, Warehouse } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#f0f4f8] dark:bg-slate-900 border border-neutral-400 dark:border-slate-800 rounded-xs shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden select-none">
        {/* Banner Header */}
        <div className={`flex items-center justify-between px-4 py-2 text-white ${isSales ? 'bg-[#006400]' : 'bg-[#800000]'}`}>
          <div className="flex items-center gap-2">
            {isSales ? <RotateCcw className="w-4 h-4 text-white" /> : <Undo2 className="w-4 h-4 text-white" />}
            <h2 className="text-xs font-bold tracking-wide uppercase">
              {isSales ? 'Sales Return Voucher' : 'Purchase Return Voucher'} - {data.returnNumber}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-6 px-2 bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs rounded-xs flex items-center gap-1 cursor-pointer border border-neutral-300"
            >
              <Printer className="w-3 h-3 text-emerald-800" /> Print Memo
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-white dark:bg-slate-900">
          {/* Header Metadata */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-neutral-300 dark:border-slate-800 pb-3">
            <div>
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mb-1 border ${
                isSales
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                {isSales ? 'Customer Sales Return' : 'Supplier Purchase Return'}
              </span>
              <h3 className="text-base font-mono font-extrabold text-neutral-900 dark:text-neutral-100">
                {data.returnNumber}
              </h3>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1 mt-0.5 font-mono">
                <Calendar className="w-3 h-3 text-neutral-400" />
                {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="text-xs space-y-1 text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-semibold">{isSales ? 'Customer:' : 'Supplier:'}</span>
                <span className="font-bold">
                  {isSales ? data.customer?.name || 'Walk-in Customer' : data.supplier?.name || 'General Supplier'}
                </span>
              </div>
              {data.warehouse && (
                <div className="flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-semibold">Warehouse:</span>
                  <span>{data.warehouse.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Refund Method:</span>
                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300">
                  {data.refundType === 'CREDIT_ADJUSTMENT' ? 'Due Credit' : 'Cash Refund'}
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          {data.reason && (
            <div className="p-2 bg-[#eaf1f8] dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-xs text-xs">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">Return Reason: </span>
              <span className="text-neutral-700 dark:text-neutral-300">{data.reason}</span>
            </div>
          )}

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-1.5">
              Returned Items Detail
            </h4>
            <div className="border border-neutral-400 dark:border-slate-700 rounded-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 font-bold border-b border-neutral-400 dark:border-slate-700">
                  <tr>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 w-8 text-center">SN</th>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700">Product</th>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-center w-24">Qty</th>
                    <th className="p-2 border-r border-neutral-300 dark:border-slate-700 text-right w-24">Unit Price</th>
                    <th className="p-2 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  {data.items?.map((item: any, i: number) => (
                    <tr key={item.id || i} className="hover:bg-neutral-50 dark:hover:bg-slate-850">
                      <td className="p-2 border-r border-neutral-200 dark:border-slate-800 text-center text-neutral-500 font-mono">
                        {i + 1}
                      </td>
                      <td className="p-2 border-r border-neutral-200 dark:border-slate-800 font-semibold">
                        {item.product?.name}
                        {item.product?.sku && (
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            SKU: {item.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border-r border-neutral-200 dark:border-slate-800 text-center font-bold">
                        {Number(item.quantity).toFixed(2)} {item.product?.unit || ''}
                      </td>
                      <td className="p-2 border-r border-neutral-200 dark:border-slate-800 text-right font-mono">
                        ৳{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        ৳{Number(item.lineTotal || item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subtotal & Total */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-1 text-xs bg-[#eaf1f8] dark:bg-slate-800 p-2.5 border border-neutral-400 dark:border-slate-700 rounded-xs">
              <div className="flex justify-between text-neutral-700 dark:text-neutral-300 font-medium">
                <span>Subtotal Items Total:</span>
                <span className="font-mono">৳{Number(data.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-neutral-900 dark:text-neutral-100 pt-1 border-t border-neutral-300 dark:border-slate-700">
                <span>Final Refund Amount:</span>
                <span className={`font-mono ${isSales ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  ৳{Number(data.refundAmount || data.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2 bg-[#b0c8de] dark:bg-slate-800 border-t border-[#9fbcd6] dark:border-slate-700 flex justify-between items-center text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200">
          <span>Processed by: {data.createdBy?.name || 'System Admin'}</span>
          <button
            onClick={onClose}
            className="h-6 px-3 bg-white dark:bg-slate-900 text-neutral-800 dark:text-neutral-200 border border-neutral-400 rounded-xs font-bold hover:bg-neutral-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
