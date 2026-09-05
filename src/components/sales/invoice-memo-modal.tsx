'use client';

import React, { useRef } from 'react';
import { Sale } from '@/lib/types';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

interface InvoiceMemoModalProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceMemoModal({ sale, open, onOpenChange }: InvoiceMemoModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = Number(sale.totalAmount);
  const paidAmount = Number(sale.paidAmount || (sale.paymentType === 'CASH' ? totalAmount : 0));
  const dueAmount = Number(sale.dueAmount || Math.max(0, totalAmount - paidAmount));
  const prevDue = Number(sale.customer?.currentDue || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="max-w-2xl w-full mx-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>Sales Invoice / Cash Memo</span>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Memo Container */}
        <div
          ref={printRef}
          className="p-6 bg-white text-black font-sans border border-neutral-300 rounded-md my-3 print:border-none print:p-0 print:m-0"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-neutral-800 pb-3 mb-4">
            <h1 className="text-2xl font-black tracking-wide uppercase text-neutral-900">
              M.R. Enterprise
            </h1>
            <p className="text-xs font-semibold text-neutral-700 tracking-wider uppercase">
              Wholesale & Retail General Merchant • Plastics, Cookware & Household Goods
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Proprietor: Md. Mizanur Rahman • Cell: 01712-000000, 01911-000000
            </p>
            <p className="text-xs text-neutral-500">
              Station Road, Tongi Bazar, Gazipur, Bangladesh
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 border border-neutral-800 rounded text-xs font-bold uppercase tracking-widest bg-neutral-100">
              {sale.paymentType === 'CASH' ? 'Cash Memo' : 'Credit Memo / Challan'}
            </div>
          </div>

          {/* Invoice Metadata & Customer Info */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div className="space-y-1">
              <div>
                <span className="font-semibold text-neutral-700">Customer Name: </span>
                <span className="font-bold text-neutral-900">
                  {sale.customer?.name || sale.customerName || 'Walk-in Customer'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Mobile: </span>
                <span>{sale.customer?.phone || sale.customerPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Address: </span>
                <span>{sale.customer?.address || 'Local'}</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="font-semibold text-neutral-700">Memo No: </span>
                <span className="font-mono font-bold text-neutral-900">{sale.referenceNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Date: </span>
                <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Issued By: </span>
                <span>{sale.createdBy?.name || 'Cashier'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs text-left border-collapse border border-neutral-400 mb-4">
            <thead>
              <tr className="bg-neutral-100 text-neutral-800 uppercase font-bold border-b border-neutral-400">
                <th className="p-2 border-r border-neutral-400 w-8 text-center">SL</th>
                <th className="p-2 border-r border-neutral-400">Description of Item</th>
                <th className="p-2 border-r border-neutral-400 text-center w-16">Qty</th>
                <th className="p-2 border-r border-neutral-400 text-right w-24">Rate (৳)</th>
                <th className="p-2 text-right w-28">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="border-b border-neutral-300">
                  <td className="p-2 border-r border-neutral-400 text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-neutral-400 font-medium">
                    {item.product?.name || 'Item'}
                    {item.product?.sku && (
                      <span className="text-neutral-500 text-[10px] ml-1">({item.product.sku})</span>
                    )}
                  </td>
                  <td className="p-2 border-r border-neutral-400 text-center font-semibold">
                    {item.quantity} {item.product?.unit || ''}
                  </td>
                  <td className="p-2 border-r border-neutral-400 text-right">
                    {Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {Number(item.lineTotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-between items-start text-xs pt-1">
            <div className="max-w-xs space-y-1">
              {sale.note && (
                <p className="text-neutral-600">
                  <span className="font-semibold">Note: </span>
                  {sale.note}
                </p>
              )}
              <p className="text-[10px] text-neutral-500 italic mt-3">
                * Goods once sold can only be exchanged within 7 days with this memo.
              </p>
            </div>

            <div className="w-56 space-y-1.5 border-t border-neutral-400 pt-1">
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-700">Sub Total:</span>
                <span className="font-bold">৳{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-neutral-700">Paid Amount:</span>
                <span className="font-bold text-neutral-900">৳{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-neutral-400 pt-1">
                <span className="font-bold text-neutral-900">Current Due:</span>
                <span className="font-bold text-neutral-900">৳{dueAmount.toFixed(2)}</span>
              </div>
              {prevDue > 0 && (
                <div className="flex justify-between text-[11px] text-neutral-600">
                  <span>Total Acc. Balance:</span>
                  <span className="font-bold">৳{prevDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signature Lines */}
          <div className="grid grid-cols-2 gap-8 pt-16 text-center text-xs">
            <div>
              <div className="border-t border-neutral-800 w-40 mx-auto pt-1 font-semibold text-neutral-800">
                Customer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-neutral-800 w-48 mx-auto pt-1 font-semibold text-neutral-800">
                For M.R. Enterprise
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print Memo
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
