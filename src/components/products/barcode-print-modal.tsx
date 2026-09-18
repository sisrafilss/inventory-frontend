'use client';

import React, { useState } from 'react';
import { X, Printer, Barcode, Check } from 'lucide-react';
import { BarcodeSVG } from '@/components/ui/barcode-svg';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  zIndex?: string;
}

export function BarcodePrintModal({
  isOpen,
  onClose,
  product,
  zIndex = 'z-[100]',
}: BarcodePrintModalProps) {
  const [copies, setCopies] = useState<number>(4);
  const [columns, setColumns] = useState<number>(2);
  const [showPrice, setShowPrice] = useState<boolean>(true);

  if (!isOpen || !product) return null;

  const barcodeValue = product.barcode || product.sku;
  const sellingPrice = Number(product.sellingPrice || product.dpRate || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn("fixed inset-0 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150", zIndex)}>
      <div className="bg-[#f0f4f8] dark:bg-slate-900 border border-[#004d00] dark:border-emerald-900 rounded-xs shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden select-none">
        {/* Banner Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#006400] dark:bg-emerald-950 text-white border-b border-[#004d00]">
          <div className="flex items-center gap-2">
            <Barcode className="w-4 h-4 text-white" />
            <h2 className="text-xs font-bold tracking-wide uppercase">Print Barcode Labels - {product.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-6 px-2.5 bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs rounded-xs flex items-center gap-1 cursor-pointer border border-neutral-300"
            >
              <Printer className="w-3 h-3 text-emerald-800" /> Print Sticker Labels
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800 p-3 border-b border-neutral-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-0.5">
                Sticker Copies:
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-700 rounded-xs font-bold text-center"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-800 dark:text-neutral-200 mb-0.5">
                Grid Columns:
              </label>
              <select
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value))}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-700 rounded-xs font-bold"
              >
                <option value={1}>1 Column (Single Sticker Roll)</option>
                <option value={2}>2 Columns (Dual Roll / A4)</option>
                <option value={3}>3 Columns (Standard Sheet)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 sm:pt-0">
            <label className="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              Show Price on Label
            </label>
          </div>
        </div>

        {/* Label Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900">
          <p className="text-[11px] text-neutral-500 font-mono mb-2">
            Sticker Preview ({copies} label stickers):
          </p>

          <div
            className="grid gap-3 print:gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="border border-neutral-300 dark:border-slate-700 p-2.5 bg-white rounded-xs flex flex-col items-center justify-center text-center shadow-xs select-none print:shadow-none print:border-black"
              >
                <div className="text-[11px] font-extrabold text-neutral-900 uppercase tracking-tight truncate max-w-full">
                  {product.name}
                </div>
                {product.sku && (
                  <div className="text-[9px] font-mono text-neutral-500 font-bold uppercase">
                    SKU: {product.sku}
                  </div>
                )}
                
                <div className="my-1.5">
                  <BarcodeSVG value={barcodeValue} height={38} width={1.5} showText={true} />
                </div>

                {showPrice && (
                  <div className="text-xs font-black text-neutral-900 font-mono">
                    MRP: ৳{sellingPrice.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#b0c8de] dark:bg-slate-800 border-t border-[#9fbcd6] dark:border-slate-700 flex justify-between items-center text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200">
          <span>Barcode: {barcodeValue}</span>
          <button
            onClick={onClose}
            className="h-6 px-3 bg-white text-neutral-800 border border-neutral-400 rounded-xs font-bold hover:bg-neutral-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
