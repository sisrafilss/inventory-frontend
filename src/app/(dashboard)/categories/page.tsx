'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { useLanguage } from '@/lib/context/language-context';
import { Category } from '@/lib/types';
import { Layers, Plus, Edit2, Search, X } from 'lucide-react';
import { CategoryModal } from '@/components/categories/category-modal';
import { Dialog } from '@/components/ui/dialog';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'INACTIVE'
  
  // Virtual Pagination
  const [page, setPage] = useState(1);
  const limit = 30;

  // Create / Edit Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<Category | null>(null);

  // View Details Modal & Selection
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend does not natively paginate categories currently, it returns all
      const res = await api.get<Category[]>('/categories');
      setCategories(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (statusFilter === 'ACTIVE' && !cat.isActive) return false;
      if (statusFilter === 'INACTIVE' && cat.isActive) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q) || false;
      return matchName || matchDesc;
    });
  }, [categories, statusFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && page * limit < filteredCategories.length) {
      setPage((p) => p + 1);
    }
  };

  const visibleCategories = filteredCategories.slice(0, page * limit);
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  const handleOpenCreateModal = () => {
    setModalCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setModalCategory(cat);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-neutral-100 dark:bg-slate-950 font-sans">
      {/* Top Header Banner */}
      <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-300" />
          <h1 className="text-sm font-bold text-white tracking-wide uppercase">
            Product Categories
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="h-6 px-3 bg-[#e6f2ff] text-[#006400] font-bold text-[11px] uppercase tracking-wider rounded-none hover:bg-white transition-colors border border-transparent hover:border-[#006400] flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2 sm:p-3 gap-3">
        {/* Filter Bar */}
        <div className="bg-[#c6d8ea] dark:bg-slate-800/80 p-2 border border-[#9fbcd6] dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-2 top-1 text-neutral-500" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-6 pl-8 pr-2 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
              />
            </div>
            
            <div className="flex items-center gap-1.5 ml-2 border-l border-neutral-400 dark:border-slate-600 pl-2">
              <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-6 px-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[#006400]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>
          
          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-semibold px-2">
             Press <kbd className="bg-white dark:bg-slate-700 px-1 border border-neutral-300 dark:border-slate-600 rounded">F5</kbd> to refresh
          </div>
        </div>

        {/* Categories Table Container */}
        <div className="flex-1 flex flex-col border border-[#800000] dark:border-rose-900/50 bg-[#eaf1f8] dark:bg-slate-900 overflow-hidden shadow-md">
          
          {/* Error Message */}
          {error && (
            <div className="bg-rose-100 text-rose-800 p-2 text-xs font-bold text-center border-b border-rose-200">
              {error}
            </div>
          )}

          {/* Desktop Spreadsheet Data Grid */}
          <div className="flex-1 min-h-[300px] flex flex-col border-b border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col" onScroll={handleTableScroll}>
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                  <tr>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-12 text-center">SN</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-64">Category Name</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">Description</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-center">Products Count</th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">Status</th>
                    <th className="px-3 py-1.5 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-800 dark:text-neutral-200">
                  {loading && visibleCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-500 font-medium">
                        Loading categories...
                      </td>
                    </tr>
                  ) : visibleCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-500 font-medium">
                        No categories found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    visibleCategories.map((cat, idx) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                      <tr
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat)}
                        onDoubleClick={() => setViewCategory(cat)}
                        title="Double-click to view details"
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>
                          {idx + 1}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Layers className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
                            <span>{cat.name}</span>
                          </div>
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 truncate max-w-sm ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {cat.description || '--'}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-xs font-mono font-bold border ${
                            isSelected
                              ? 'bg-blue-800 text-white border-blue-700'
                              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-slate-700'
                          }`}>
                            {cat._count?.products ?? 0}
                          </span>
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase border ${
                              cat.isActive
                                ? isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : isSelected
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(cat); }}
                            className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                            }`}
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-blue-900 dark:text-blue-300">
                Loaded <strong>{visibleCategories.length}</strong> total of <strong>{filteredCategories.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-900 dark:text-emerald-300">
                Active: <strong>{activeCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-400">
                Inactive: <strong>{inactiveCount}</strong>
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {selectedCategory ? (
                <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedCategory.name}
                </span>
              ) : (
                <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                  Tip: Double-click a row to view details
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        category={modalCategory}
        onSuccess={() => fetchCategories()}
      />

      {/* View Category Details Modal */}
      <Dialog
        open={!!viewCategory}
        onOpenChange={(isOpen) => !isOpen && setViewCategory(null)}
        draggable={true}
        className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <div
          data-drag-handle
          className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        >
          <h2 className="text-[13px] font-bold text-white tracking-wide pointer-events-none select-none">
            Category Details
          </h2>
          <button
            type="button"
            onClick={() => setViewCategory(null)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {viewCategory && (
          <div className="flex flex-col">
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* General Info */}
              <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm">
                <h3 className="font-bold text-neutral-500 uppercase tracking-wide border-b pb-1 mb-2">General Info</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Category Name:</span><span className="font-bold text-neutral-900 dark:text-neutral-100">{viewCategory.name}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Status:</span>
                    <span className={`font-bold uppercase ${viewCategory.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {viewCategory.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-neutral-500 font-semibold">Assigned Products:</span><span className="font-bold text-neutral-900 dark:text-neutral-100">{viewCategory._count?.products || 0}</span></div>
                </div>
              </div>
              
              {/* Description */}
              <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm">
                <h3 className="font-bold text-neutral-500 uppercase tracking-wide border-b pb-1 mb-2">Description</h3>
                <p className="text-neutral-800 dark:text-neutral-200">{viewCategory.description || 'None'}</p>
              </div>
            </div>
            
            <div className="bg-[#b0c8de] dark:bg-slate-800 border-t border-[#9fbcd6] dark:border-slate-700 p-3 px-4 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewCategory(null)}
                className="h-7 px-4 bg-white dark:bg-slate-700 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-neutral-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const cat = viewCategory;
                  setViewCategory(null);
                  handleOpenEditModal(cat);
                }}
                className="h-7 px-4 bg-white dark:bg-slate-700 text-[#006400] dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
