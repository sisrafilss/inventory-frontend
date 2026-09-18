'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { X, Package, Edit2, Barcode, DollarSign, Layers } from 'lucide-react';
import { Product } from '@/lib/types';
import { BarcodeSVG } from '@/components/ui/barcode-svg';
import { formatStock, formatUnitLabel } from '@/lib/stock-utils';

export interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
  onPrintBarcode?: (product: Product) => void;
}

export function ProductDetailsModal({
  open,
  onOpenChange,
  product,
  onEdit,
  onPrintBarcode,
}: ProductDetailsModalProps) {
  if (!open || !product) return null;

  const costPrice = Number(product.costPrice || 0);
  const sellingPrice = Number(product.sellingPrice || 0);
  const quantity = Number(product.quantity || 0);
  const reorderLevel = Number(product.reorderLevel || 0);

  const status =
    product.stockStatus ||
    (quantity <= 0
      ? 'OUT_OF_STOCK'
      : quantity <= reorderLevel
      ? 'LOW_STOCK'
      : 'IN_STOCK');

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      draggable={true}
      closeOnBackdropClick={true}
      zIndex="z-[80]"
      className="p-0 max-w-2xl w-full border-2 border-[#006400] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Top Banner Header */}
      <div
        data-drag-handle
        title="Click and drag to move window"
        className="relative bg-[#006400] dark:bg-emerald-950 py-2 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between cursor-grab active:cursor-grabbing text-white"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-300" />
          <h2 className="text-sm font-bold tracking-wide">
            Product Specifications & Stock Details
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 text-xs">
        {/* Product Identity Banner */}
        <div className="bg-[#dbe7f3] dark:bg-slate-800 p-3 rounded-xs border border-[#b2c8dc] dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 font-mono text-xs font-bold bg-[#006400] text-white rounded-xs">
                #{product.sku}
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {product.name}
              </h3>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
              {product.company?.name ? `Company: ${product.company.name}` : ''}
              {product.category?.name ? ` • Category: ${product.category.name}` : ''}
            </p>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-bold uppercase rounded-xs border ${
              status === 'IN_STOCK'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                : status === 'LOW_STOCK'
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* General & Physical Info */}
          <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-xs space-y-1.5">
            <h4 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] border-b pb-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#006400] dark:text-emerald-400" />
              <span>General & Attributes</span>
            </h4>
            <div className="space-y-1 font-sans">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Product SKU:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {product.sku}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Barcode:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {product.barcode || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Unit:</span>
                <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                  {formatUnitLabel(product.unit)}
                  {product.packSize && product.packSize > 1
                    ? ` (${product.packSize} Pcs/${formatUnitLabel(product.unit)})`
                    : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Total Stock (All Godowns):</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatStock(quantity, product.unit, product.packSize)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Reorder Threshold:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {formatStock(reorderLevel, product.unit, product.packSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Commercial Info */}
          <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-xs space-y-1.5">
            <h4 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] border-b pb-1 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <span>Pricing & Commercials</span>
            </h4>
            <div className="space-y-1 font-sans">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Purchase Rate (Cost):</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  ৳{costPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Sale Rate (Retail):</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  ৳{sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {product.dpRate ? (
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">DP Rate:</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    ৳{Number(product.dpRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}
              {product.commissionPercent ? (
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-semibold">Commission:</span>
                  <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">
                    {Number(product.commissionPercent)}%
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between pt-0.5 border-t border-neutral-200 dark:border-slate-700">
                <span className="text-neutral-500 font-semibold">Total Stock Cost Value:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  ৳{(quantity * costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-semibold">Total Stock Retail Value:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  ৳{(quantity * sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse Stocks Table */}
        {product.warehouseStocks && product.warehouseStocks.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-xs space-y-1.5">
            <h4 className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px] border-b pb-1">
              Stock Distribution by Godown / Warehouse
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {product.warehouseStocks.map((ws) => (
                <div
                  key={ws.id}
                  className="flex justify-between items-center p-2 bg-[#f4f8fc] dark:bg-slate-900/50 border border-neutral-300 dark:border-slate-700 shadow-xs"
                >
                  <span
                    className="font-semibold text-neutral-700 dark:text-neutral-300 truncate pr-2 text-xs"
                    title={ws.warehouse?.name || 'Godown'}
                  >
                    {ws.warehouse?.name || 'Godown'}
                  </span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      Number(ws.quantity) > 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {Number(ws.quantity)} {formatUnitLabel(product.unit)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barcode Sticker Preview Box */}
        <div className="bg-white dark:bg-slate-800 p-2.5 border border-neutral-400 dark:border-slate-600 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xs border border-neutral-300 dark:border-slate-600 flex items-center justify-center shadow-xs">
              <BarcodeSVG
                value={product.barcode || product.sku}
                width={1.5}
                height={36}
                showText={false}
              />
            </div>
            <div>
              <div className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                Barcode Label
              </div>
              <div className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                {product.barcode || product.sku}
              </div>
            </div>
          </div>

          {onPrintBarcode && (
            <button
              type="button"
              onClick={() => onPrintBarcode(product)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Print Barcode Label</span>
            </button>
          )}
        </div>

        {product.description && (
          <div className="bg-white dark:bg-slate-800 p-2.5 border border-neutral-400 dark:border-slate-600 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-0.5">
              Description / Notes
            </span>
            <p className="text-neutral-800 dark:text-neutral-200">{product.description}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-7 px-4 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(product);
              }}
              className="h-7 px-4 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Product</span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

