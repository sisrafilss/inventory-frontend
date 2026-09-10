'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { Expense } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Receipt, Plus, Search, Calendar, DollarSign, Tag, Trash2, Edit2, Loader2, AlertCircle, X, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';

const CATEGORIES = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'RENT', label: 'Shop / Godown Rent' },
  { value: 'UTILITY', label: 'Electricity / Water / Gas' },
  { value: 'SALARY', label: 'Staff Salary & Wages' },
  { value: 'ENTERTAINMENT', label: 'Customer Tea / Entertainment' },
  { value: 'REPAIR', label: 'Maintenance & Repairs' },
  { value: 'OFFICE_SUPPLIES', label: 'Stationery & Printing' },
  { value: 'TRANSPORT', label: 'Freight & Cartage' },
  { value: 'OTHER', label: 'Other Operating Expenses' },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Data & Pagination
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, totalAmount: 0 });
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selection & View Modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'UTILITY',
    amount: '' as number | string,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  
  // Delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      setError(null);
      const res = await api.get<Expense[]>('/expenses', {
        page,
        limit,
        search: debouncedSearch || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      
      if (page === 1) {
        setExpenses(res.data);
      } else {
        setExpenses((prev) => [...prev, ...res.data]);
      }
      
      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          totalAmount: (res.meta as any).totalAmount || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, limit, debouncedSearch, selectedCategory, startDate, endDate]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !loadingMore && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setForm({
      title: '',
      category: 'UTILITY',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({
      title: exp.title,
      category: exp.category,
      amount: Number(exp.amount),
      date: new Date(exp.date).toISOString().split('T')[0],
      note: exp.note || '',
    });
    setIsModalOpen(true);
  };

  const validateAndConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid title and amount.');
      return;
    }
    setShowConfirmSave(true);
  };

  const executeSave = async () => {
    setShowConfirmSave(false);
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: form.date ? new Date(form.date).toISOString() : undefined,
      };

      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}`, payload);
        toast.success('Expense updated successfully.');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense recorded successfully.');
      }
      setIsModalOpen(false);
      if (page === 1) fetchExpenses();
      else setPage(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${expenseToDelete.id}`);
      toast.success('Expense deleted successfully.');
      setExpenseToDelete(null);
      if (page === 1) fetchExpenses();
      else setPage(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Receipt className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">{t('expenses.title')}</h1>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-2.5 py-1 text-xs font-bold bg-white text-[#006400] border border-[#004d00] shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('expenses.addExpense')}</span>
            </button>
          )}
        </div>

        {/* Gray Filter Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-2 items-center text-sm">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap text-xs uppercase tracking-wider">{t('common.search')}:</label>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder={t('expenses.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider">Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <span className="text-neutral-500 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>
          
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="h-7 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm"
          >
            Reset
          </button>
        </div>

        {/* Data Table */}
        <div 
          className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-950 relative custom-scrollbar"
          onScroll={handleTableScroll}
        >
          <table className="w-full text-xs text-left min-w-[700px] border-collapse relative">
            <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <tr>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24">Date</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[180px]">Expense Title</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-40">Category</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[160px]">Note / Ref</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right">Amount</th>
                {canManage && <th className="px-3 py-1.5 w-20 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {loading && page === 1 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Loading expenses...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-12 text-center text-rose-600 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-neutral-400" />
                      <span>No expenses found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {expenses.map((exp, idx) => {
                    const isSelected = selectedExpense?.id === exp.id;
                    return (
                      <tr
                        key={exp.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setSelectedExpense(exp)}
                        onDoubleClick={() => setViewExpense(exp)}
                        title="Double-click to view details"
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>{formatDate(exp.date)}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{exp.title}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {getCategoryLabel(exp.category)}
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 truncate max-w-[200px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{exp.note || '--'}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono font-bold ${isSelected ? 'text-white' : 'text-rose-700 dark:text-rose-400'}`}>
                          ৳ {Number(exp.amount).toFixed(2)}
                        </td>
                        {canManage && (
                          <td className="px-2 py-1 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(exp); }}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                                title="Edit Expense"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setExpenseToDelete(exp); }}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-rose-600 border-white hover:bg-rose-50'
                                    : 'bg-white dark:bg-slate-800 text-rose-600 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                }`}
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {loadingMore && (
                    <tr>
                      <td colSpan={canManage ? 7 : 6} className="py-6 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status / Summary Bar */}
        <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-blue-900 dark:text-blue-300">
              Loaded <strong>{expenses.length}</strong> total of <strong>{meta.total}</strong>
            </span>
            <span>•</span>
            <span className="text-rose-900 dark:text-rose-300">
              Filtered Total: <strong className="text-rose-700 dark:text-rose-400">৳ {meta.totalAmount.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
            {selectedExpense ? (
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedExpense.title}
              </span>
            ) : (
              <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                Tip: Double-click a row to view details
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog
        open={!!viewExpense}
        onOpenChange={(open) => { if (!open) setViewExpense(null); }}
        draggable={true}
        closeOnBackdropClick={true}
        className="p-0 max-w-lg w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        {viewExpense && (
          <div className="flex flex-col">
            <div
              data-drag-handle
              className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
            >
              <h2 className="text-lg font-bold text-white tracking-wide">Expense Details</h2>
              <button
                type="button"
                onClick={() => setViewExpense(null)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-white dark:bg-slate-800 p-3 border border-neutral-400 dark:border-slate-600 shadow-sm font-sans space-y-2 text-sm text-neutral-900 dark:text-neutral-100">
                <div className="flex justify-between border-b border-neutral-200 dark:border-slate-700 pb-1">
                  <span className="text-neutral-500 font-semibold">Title:</span>
                  <span className="font-bold">{viewExpense.title}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 dark:border-slate-700 pb-1">
                  <span className="text-neutral-500 font-semibold">Category:</span>
                  <span>{getCategoryLabel(viewExpense.category)}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 dark:border-slate-700 pb-1">
                  <span className="text-neutral-500 font-semibold">Date:</span>
                  <span className="font-mono">{formatDate(viewExpense.date)}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 dark:border-slate-700 pb-1">
                  <span className="text-neutral-500 font-semibold">Logged By:</span>
                  <span>{viewExpense.createdBy?.name || '—'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-neutral-500 font-semibold">Amount:</span>
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-400 text-base">
                    ৳ {Number(viewExpense.amount).toFixed(2)}
                  </span>
                </div>
              </div>
              
              {viewExpense.note && (
                <div className="bg-[#fffdf0] dark:bg-amber-950/20 p-3 border border-amber-300 dark:border-amber-700 shadow-sm text-sm">
                  <h4 className="font-bold text-amber-800 dark:text-amber-500 mb-1">Note / Reference:</h4>
                  <p className="text-amber-900 dark:text-amber-200">{viewExpense.note}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewExpense(null)}
                  className="w-24 h-7 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      const exp = viewExpense;
                      setViewExpense(null);
                      handleOpenEdit(exp);
                    }}
                    className="h-7 px-4 bg-white dark:bg-slate-700 text-[#006400] dark:text-emerald-400 border border-neutral-400 dark:border-slate-600 font-bold text-[11px] uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-md w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <form onSubmit={validateAndConfirm} className="flex flex-col">
          <div
            data-drag-handle
            className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <h2 className="text-lg font-bold text-white tracking-wide">
              {editingExpense ? 'Edit Expense' : 'Add Daily Cost / Expense'}
            </h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Expense Title <span className="text-rose-600">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Electric Bill, Staff Tea"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-8 px-1.5 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {CATEGORIES.filter(c => c.value !== 'ALL').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Amount (৳) <span className="text-rose-600">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full h-8 px-2 text-sm font-mono font-bold text-rose-700 dark:text-rose-400 border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Date of Expense <span className="text-rose-600">*</span>
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full h-8 px-2 text-sm font-mono border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Note / Reference
              </label>
              <input
                type="text"
                placeholder="Receipt #, Voucher details..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full h-8 px-2 text-sm border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-28 h-8 bg-[#006400] hover:bg-emerald-800 text-white border border-[#004d00] font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                {isSaving ? 'Saving' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Save Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmSave}
        onOpenChange={(isOpen) => !isSaving && setShowConfirmSave(isOpen)}
        title="Confirm Expense"
        description={`Are you sure you want to ${editingExpense ? 'update' : 'record'} this expense?`}
        onConfirm={executeSave}
        confirmText="Save"
        cancelText="Cancel"
        variant="success"
        isLoading={isSaving}
        loadingText="Saving..."
        details={[
          { label: 'Title:', value: form.title },
          { label: 'Category:', value: getCategoryLabel(form.category) },
          { label: 'Amount:', value: `৳ ${Number(form.amount).toFixed(2)}`, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Date:', value: form.date },
        ]}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(isOpen) => !isDeleting && !isOpen && setExpenseToDelete(null)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={executeDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
        details={expenseToDelete ? [
          { label: 'Title:', value: expenseToDelete.title },
          { label: 'Category:', value: getCategoryLabel(expenseToDelete.category) },
          { label: 'Amount:', value: `৳ ${Number(expenseToDelete.amount).toFixed(2)}`, color: 'text-rose-600 dark:text-rose-400' },
        ] : []}
      />
    </div>
  );
}
