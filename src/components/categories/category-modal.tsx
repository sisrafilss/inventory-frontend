'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { X, Loader2, Save, RotateCcw, Layers } from 'lucide-react';
import { Category } from '@/lib/types';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

export interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess?: (category?: Category) => void;
}

export function CategoryModal({
  open,
  onOpenChange,
  category = null,
  onSuccess,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name || '');
        setDescription(category.description || '');
        setIsActive(category.isActive !== false);
      } else {
        resetForm();
      }
      setStatusMessage(null);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [open, category]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setStatusMessage(null);
    nameInputRef.current?.focus();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ text: 'Category name is required.', isError: true });
      return;
    }
    
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
    };

    try {
      if (category) {
        await api.patch(`/categories/${category.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created successfully');
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to save category.', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isSaving && onOpenChange(isOpen)}
      draggable={true}
      closeOnBackdropClick={false}
      className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div
        data-drag-handle
        className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
      >
        <Layers className="w-4 h-4 text-emerald-300 pointer-events-none" />
        <h2 className="text-[13px] font-bold text-white tracking-wide pointer-events-none">
          {category ? 'Edit Category' : 'Create New Category'}
        </h2>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSave} className="flex flex-col">
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          <div className="grid grid-cols-12 gap-x-4 gap-y-3">
            <label className="col-span-3 text-right font-semibold text-neutral-800 dark:text-neutral-200 mt-1.5">
              Name: <span className="text-rose-600">*</span>
            </label>
            <div className="col-span-9">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
                className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-none text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
                required
              />
            </div>

            <label className="col-span-3 text-right font-semibold text-neutral-800 dark:text-neutral-200 mt-1.5">
              Description:
            </label>
            <div className="col-span-9">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="w-full h-8 px-2 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 rounded-none text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
              />
            </div>

            <div className="col-span-9 col-start-4 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="catIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-3.5 h-3.5 border-neutral-400"
              />
              <label htmlFor="catIsActive" className="text-xs font-bold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                Active Category
              </label>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-2 border ${statusMessage.isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'} text-xs font-bold text-center`}>
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#b0c8de] dark:bg-slate-800 border-t border-[#9fbcd6] dark:border-slate-700 p-3 px-4 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {!category && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="h-7 px-3 bg-white dark:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-7 px-4 bg-white dark:bg-slate-700 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="h-7 px-6 bg-[#006400] text-white border border-[#004d00] font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  {category ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
