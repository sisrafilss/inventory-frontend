"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Sale } from "../../lib/types";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, RotateCcw, X } from "lucide-react";
import { numberToWords } from "@/lib/number-to-words";

export interface MemoSaleItem {
  id?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: {
    name?: string;
    sku?: string;
    unit?: string;
  };
}

export interface MemoSale {
  id?: string;
  referenceNumber?: string;
  totalAmount: number;
  paidAmount?: number;
  paymentType?: "CASH" | "CREDIT";
  dueAmount?: number;
  discount?: number;
  netAmount?: number;
  totalPurchaseCost?: number;
  profit?: number;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    address?: string | null;
    currentDue?: number;
  } | null;
  customerName?: string | null;
  customerPhone?: string | null;
  createdBy?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string | null;
  };
  note?: string | null;
  createdAt?: string;
  items: MemoSaleItem[];
}

interface InvoiceMemoModalProps {
  sale: MemoSale | Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate filesystem-safe default PDF name from invoice ID and generation date-time
function generateDefaultFileName(sale: MemoSale | Sale | null): string {
  if (!sale) return "Invoice_Memo";
  const memoSale = sale as MemoSale;
  const rawId =
    memoSale.referenceNumber ||
    (memoSale.id
      ? memoSale.id.length > 12
        ? memoSale.id.slice(0, 8)
        : memoSale.id
      : "INV");
  const cleanId = rawId
    .replace(/[<>:"/\\|?*\s]/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const d = memoSale.createdAt ? new Date(memoSale.createdAt) : new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hourStr = String(hours).padStart(2, "0");

  return `${cleanId}_${day}-${month}-${year}_${hourStr}-${minutes}-${seconds}${ampm}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "-");
}

export function InvoiceMemoModal({
  sale,
  open,
  onOpenChange,
}: InvoiceMemoModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState<string>(() =>
    generateDefaultFileName(sale),
  );

  // Update default file name when a new sale is loaded or modal opens
  useEffect(() => {
    if (open && sale) {
      setFileName(generateDefaultFileName(sale));
    }
  }, [open, sale]);

  if (!sale) return null;

  const memoSale = sale as MemoSale;
  const totalAmount = Number(memoSale.totalAmount || 0);
  const paidAmount = Number(
    memoSale.paidAmount ?? (memoSale.paymentType === "CASH" ? totalAmount : 0),
  );
  const dueAmount = Number(
    memoSale.dueAmount ?? Math.max(0, totalAmount - paidAmount),
  );
  const prevDue = Number(memoSale.customer?.currentDue || 0);

  const handleResetFileName = () => {
    setFileName(generateDefaultFileName(sale));
  };

  const handlePrint = () => {
    if (typeof document !== "undefined") {
      const originalTitle = document.title;
      const targetName = (
        fileName.trim() || generateDefaultFileName(sale)
      ).replace(/\.pdf$/i, "");

      // Temporarily set document.title so browser's "Save as PDF" pre-fills this filename
      document.title = targetName;

      window.print();

      const restore = () => {
        document.title = originalTitle;
        window.removeEventListener("afterprint", restore);
      };
      window.addEventListener("afterprint", restore);
      setTimeout(restore, 3000);
    } else {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} zIndex="z-[70]">
      <div className="max-w-2xl w-full mx-auto">
        <DialogHeader className="no-print print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>Sales Invoice / Cash Memo</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* PDF / File Name Config Toolbar (Editable before print/save) */}
        <div className="no-print print:hidden mt-2 p-2.5 bg-neutral-100 dark:bg-slate-800/90 border border-neutral-300 dark:border-slate-700 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 flex-1 w-full">
            <label className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>PDF / File Name:</span>
            </label>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(sanitizeFileName(e.target.value))}
                placeholder="Enter file name..."
                className="flex-1 h-7 px-2 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-600 rounded text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                title="This name will be automatically used when saving as PDF"
              />
              <span className="text-neutral-500 dark:text-neutral-400 font-mono font-semibold text-[11px] shrink-0">
                .pdf
              </span>
              <button
                type="button"
                onClick={handleResetFileName}
                title="Reset to default generated file name (Invoice ID + Date-Time)"
                className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Memo Container */}
        <div
          ref={printRef}
          className="p-4 sm:p-6 bg-white text-black font-sans border border-neutral-300 rounded-md my-3 print:border-none print:p-0 print:m-0"
        >
          {/* Header */}
          <div className="border-b-[1.5px] border-black pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div className="w-20"></div>
              <div className="text-center flex-1">
                <div className="flex justify-end mb-1">
                  <span className="bg-black text-white px-3 py-0.5 font-bold italic text-[10px] sm:text-xs uppercase tracking-wider">
                    Exclusive
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black tracking-wide uppercase text-black mb-1">
                  M/S M. R. Enterprise
                </h1>
                <p className="text-[10px] sm:text-xs font-bold text-black mb-1.5">
                  Proprietor: S. M. Toufique Elahi
                </p>
                <div className="bg-black text-white px-2 py-1 flex items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-[11px] font-semibold w-max mx-auto leading-none">
                  <span>Shiromoni Bazar, Khanjahan Ali, Khulna.</span>
                  <span>📱 01913-897577</span>
                </div>
                <div className="text-[10px] sm:text-xs font-semibold text-black mt-1 py-0.5 flex items-center justify-center gap-2">
                  <span>✉ toufiqueelahi143@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Metadata & Customer Info */}
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[13px] mb-4 border-b-[1.5px] border-black pb-3">
            <div className="space-y-2">
              <div className="flex">
                <span className="w-14 sm:w-16 font-bold text-black whitespace-nowrap">
                  No:
                </span>
                <span className="font-mono font-bold text-black border-b-[1.5px] border-dotted border-black flex-1 mr-2 sm:mr-4 pl-1">
                  {memoSale.referenceNumber}
                </span>
              </div>
              <div className="flex">
                <span className="w-14 sm:w-16 font-bold text-black whitespace-nowrap">
                  Name:
                </span>
                <span className="font-bold text-black border-b-[1.5px] border-dotted border-black flex-1 mr-2 sm:mr-4 pl-1">
                  {memoSale.customer?.name ||
                    memoSale.customerName ||
                    "Walk-in Customer"}
                </span>
              </div>
              <div className="flex">
                <span className="w-14 sm:w-16 font-bold text-black whitespace-nowrap">
                  Address:
                </span>
                <span className="font-semibold text-black border-b-[1.5px] border-dotted border-black flex-1 mr-2 sm:mr-4 pl-1">
                  {memoSale.customer?.address || "Local"}
                </span>
              </div>
            </div>

            <div className="space-y-2 pl-2">
              <div className="flex">
                <span className="w-12 sm:w-14 font-bold text-black whitespace-nowrap">
                  Date:
                </span>
                <span className="font-semibold text-black border-b-[1.5px] border-dotted border-black flex-1 pl-1">
                  {new Date(
                    memoSale.createdAt || Date.now(),
                  ).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex pt-[21px] sm:pt-[24px]">
                <span className="w-12 sm:w-14 font-bold text-black whitespace-nowrap">
                  Mobile:
                </span>
                <span className="font-semibold text-black border-b-[1.5px] border-dotted border-black flex-1 pl-1">
                  {memoSale.customer?.phone || memoSale.customerPhone || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-2">
            <table className="w-full text-[11px] sm:text-[13px] text-left border-collapse border border-black min-w-full">
              <thead>
                <tr className="text-black uppercase font-bold border-b border-black">
                  <th className="p-1 sm:p-2 border-r border-black w-10 text-center">
                    SL No
                  </th>
                  <th className="p-1 sm:p-2 border-r border-black text-center">
                    Description
                  </th>
                  <th className="p-1 sm:p-2 border-r border-black text-center w-20">
                    Quantity
                  </th>
                  <th className="p-1 sm:p-2 border-r border-black text-center w-20">
                    Rate
                  </th>
                  <th className="p-1 sm:p-2 text-center w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {memoSale.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-black last:border-b-0"
                  >
                    <td className="p-1 sm:p-2 border-r border-black text-center font-semibold">
                      {idx + 1}
                    </td>
                    <td className="p-1 sm:p-2 border-r border-black font-semibold">
                      {item.product?.name || "Item"}
                    </td>
                    <td className="p-1 sm:p-2 border-r border-black text-center font-semibold">
                      {item.quantity} {item.product?.unit || ""}
                    </td>
                    <td className="p-1 sm:p-2 border-r border-black text-right font-semibold">
                      {Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="p-1 sm:p-2 text-right font-bold">
                      {Number(item.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start text-[11px] sm:text-[13px] mb-8 mt-4">
            <div className="flex-1 w-full sm:pr-4">
              <div className="flex items-start">
                <span className="font-bold text-black whitespace-nowrap mr-2">
                  In Words:
                </span>
                <span className="font-bold text-black border-b-[1.5px] border-dotted border-black flex-1 min-h-[1.5rem]">
                  {numberToWords(Number(memoSale.netAmount || totalAmount))}{" "}
                  Taka
                </span>
              </div>
            </div>

            <div className="w-full sm:w-64 mt-4 sm:mt-0">
              <div className="border border-black p-1 sm:p-2 space-y-1 sm:space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black uppercase">
                    Sub Total
                  </span>
                  <span className="font-bold text-black">
                    {totalAmount.toFixed(2)}
                  </span>
                </div>
                {Number(memoSale.discount || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black uppercase">
                      Discount
                    </span>
                    <span className="font-bold text-black">
                      -{Number(memoSale.discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-black pt-1">
                  <span className="font-black text-black uppercase text-[12px] sm:text-[14px]">
                    Total
                  </span>
                  <span className="font-black text-black text-[12px] sm:text-[14px]">
                    {Number(
                      memoSale.netAmount ||
                        totalAmount - (memoSale.discount || 0),
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black uppercase">Paid</span>
                  <span className="font-bold text-black">
                    {paidAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-dashed border-black pt-1">
                  <span className="font-bold text-black uppercase">Due</span>
                  <span className="font-bold text-black">
                    {dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Lines */}
          <div className="flex justify-between items-end pt-12 sm:pt-16 text-center text-[11px] sm:text-xs">
            <div className="w-32 sm:w-40 border-t-[1.5px] border-black pt-1 font-bold text-black">
              Customer Signature
            </div>
            <div className="w-32 sm:w-40 border-t-[1.5px] border-black pt-1 font-bold text-black">
              Authorized Signature
            </div>
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center border-t-[1.5px] border-black pt-2">
            <p className="text-[9px] sm:text-[11px] font-bold text-black">
              Wholesaler and retailer of RFL Plastic, Italiano Melamine, Winner,
              Topper, Vision-Vigo Electronics,
            </p>
            <p className="text-[9px] sm:text-[11px] font-bold text-black">
              RFL Gas Stove, Nasir Glassware, Kiam Houseware.
            </p>
          </div>
        </div>

        <DialogFooter className="no-print print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <Printer className="w-4 h-4" /> Print Memo / Save PDF
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
