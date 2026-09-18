'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Warehouse } from '@/lib/types';
import { Search, X, Check, ChevronsUpDown, CheckSquare, Square } from 'lucide-react';

interface WarehouseMultiSelectProps {
  warehouses: Warehouse[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function WarehouseMultiSelect({
  warehouses,
  selectedIds,
  onChange,
  placeholder = 'Search & select warehouses...',
  disabled = false,
}: WarehouseMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWarehouses = warehouses.filter((w) => w.isActive !== false);

  const filteredWarehouses = activeWarehouses.filter((w) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = w.name.toLowerCase().includes(term);
    const codeMatch = w.code ? w.code.toLowerCase().includes(term) : false;
    return nameMatch || codeMatch;
  });

  const allSelected =
    activeWarehouses.length > 0 &&
    activeWarehouses.every((w) => selectedIds.includes(w.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(activeWarehouses.map((w) => w.id));
    }
  };

  const toggleWarehouse = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeWarehouse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const selectedWarehouses = warehouses.filter((w) => selectedIds.includes(w.id));

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      {/* Container Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`min-h-[34px] w-full px-2 py-1 bg-white dark:bg-slate-900 border ${
          isOpen
            ? 'border-[#006400] ring-1 ring-[#006400]/20'
            : 'border-neutral-400 dark:border-slate-600'
        } rounded-xs flex flex-wrap items-center gap-1.5 cursor-pointer transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-slate-800' : ''
        }`}
      >
        {/* Chips for Selected Warehouses */}
        {selectedWarehouses.map((w) => (
          <span
            key={w.id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#eaf1f8] dark:bg-slate-800 text-[#006400] dark:text-emerald-300 border border-[#9fbcd6] dark:border-slate-700 rounded-xs font-semibold text-[11px] shadow-2xs"
          >
            <span className="truncate max-w-[130px]">{w.name}</span>
            {w.code && (
              <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                ({w.code})
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => removeWarehouse(e, w.id)}
                className="hover:bg-neutral-300/50 dark:hover:bg-slate-700 p-0.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:text-rose-600 transition-colors"
                title={`Remove ${w.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Inline Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-neutral-900 dark:text-neutral-100 text-xs placeholder:text-neutral-400 placeholder:italic py-0.5"
        />

        {/* Dropdown Toggle Icon */}
        <div className="ml-auto flex items-center gap-1 shrink-0 text-neutral-400">
          {selectedIds.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
                setSearchTerm('');
              }}
              className="hover:text-rose-600 p-0.5"
              title="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Suggestion Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xs shadow-xl z-50 max-h-60 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Quick Actions */}
          <div className="bg-[#f0f4f8] dark:bg-slate-800/80 px-2.5 py-1.5 border-b border-neutral-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">
              {selectedIds.length} of {activeWarehouses.length} Selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="font-bold text-[#006400] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="w-3 h-3" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3" /> Select All ({activeWarehouses.length})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warehouse Suggestions List */}
          <div className="overflow-y-auto max-h-48 divide-y divide-neutral-100 dark:divide-slate-800 custom-scrollbar">
            {filteredWarehouses.length === 0 ? (
              <div className="p-3 text-center text-neutral-500 italic text-[11px]">
                No warehouses found matching "{searchTerm}"
              </div>
            ) : (
              filteredWarehouses.map((w) => {
                const isSelected = selectedIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => toggleWarehouse(w.id)}
                    className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#006400] dark:text-emerald-300 font-semibold'
                        : 'hover:bg-[#f4f8fc] dark:hover:bg-slate-800/70 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 border rounded-2xs flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#006400] border-[#004d00] text-white'
                            : 'border-neutral-400 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs">{w.name}</span>
                      {w.isDefault && (
                        <span className="px-1 py-0.2 bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-neutral-300 text-[9px] font-mono rounded-2xs">
                          Default
                        </span>
                      )}
                    </div>
                    {w.code && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-2xs text-neutral-600 dark:text-neutral-400">
                        {w.code}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

