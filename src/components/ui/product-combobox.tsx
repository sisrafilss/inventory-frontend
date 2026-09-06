'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import { Product } from '@/lib/types';
import { Search, Loader2, Check, X, Barcode } from 'lucide-react';

interface ProductComboboxProps {
  value: string;
  selectedProduct?: Product | null;
  onSelect: (product: Product) => void;
  onClear?: () => void;
  warehouseId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductCombobox({
  value,
  selectedProduct,
  onSelect,
  onClear,
  warehouseId,
  placeholder = 'Search by product name, SKU, or barcode...',
  disabled = false,
}: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<Product[]>('/products', {
          search: query.trim() || undefined,
          limit: 15,
          isActive: 'true',
        });
        setResults(res.data || []);
        setHighlightedIndex(0);

        // Auto-select on exact barcode or SKU match if typed/scanned with at least 4 chars
        if (query.trim().length >= 4 && res.data?.length === 1) {
          const item = res.data[0];
          if (
            item.barcode?.toLowerCase() === query.trim().toLowerCase() ||
            item.sku.toLowerCase() === query.trim().toLowerCase()
          ) {
            onSelect(item);
            setIsOpen(false);
            setQuery('');
          }
        }
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        handleOpen();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlightedIndex]) {
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // If a product is currently selected and the picker is not opened in edit mode
  if (selectedProduct && !isOpen) {
    // Check warehouse specific stock if available
    let displayQty = selectedProduct.quantity;
    if (warehouseId && selectedProduct.warehouseStocks) {
      const whStock = selectedProduct.warehouseStocks.find(
        (ws) => ws.warehouseId === warehouseId,
      );
      if (whStock !== undefined) {
        displayQty = whStock.quantity;
      }
    }

    return (
      <div className="flex items-center justify-between p-2 rounded-md border border-input bg-muted/20 text-xs min-h-[36px]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="font-semibold text-foreground truncate">
            {selectedProduct.name}
          </div>
          <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {selectedProduct.sku}
          </span>
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
              displayQty <= 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                : displayQty <= selectedProduct.reorderLevel
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {displayQty} {selectedProduct.unit}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className="text-[11px] text-primary hover:underline px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
          >
            Change
          </button>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted transition-colors"
              title="Remove product"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full h-9 pl-8 pr-8 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Barcode className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground/60" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-64 overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching 10,000+ catalog items...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {query.trim()
                ? `No products found matching "${query}".`
                : 'Type product name, SKU, or scan barcode to search.'}
            </div>
          ) : (
            <ul className="py-1 divide-y divide-border/40">
              {results.map((product, idx) => {
                let displayQty = product.quantity;
                if (warehouseId && product.warehouseStocks) {
                  const whStock = product.warehouseStocks.find(
                    (ws) => ws.warehouseId === warehouseId,
                  );
                  if (whStock !== undefined) {
                    displayQty = whStock.quantity;
                  }
                }

                const isSelected = value === product.id;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <li
                    key={product.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(product)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isHighlighted
                        ? 'bg-primary/10 text-foreground'
                        : 'hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">
                          {product.name}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded shrink-0">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <span className="font-mono text-[10px] text-muted-foreground/70 hidden sm:inline">
                            [{product.barcode}]
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {product.category?.name || 'Uncategorized'} • Price: ৳
                        {Number(product.sellingPrice).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          displayQty <= 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : displayQty <= product.reorderLevel
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {displayQty} {product.unit}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

