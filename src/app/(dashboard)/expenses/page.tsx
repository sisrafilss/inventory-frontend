'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Expense } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Receipt, Plus, Search, Calendar, DollarSign, Tag, Trash2 } from 'lucide-react';

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'UTILITY',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get<Expense[]>('/expenses', {
        search,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setExpenses(res.data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory]);

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.amount <= 0) {
      alert('Please provide a valid title and amount greater than 0.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/expenses', {
        ...form,
        amount: Number(form.amount),
        date: form.date ? new Date(form.date).toISOString() : undefined,
      });
      setModalOpen(false);
      setForm({
        title: '',
        category: 'UTILITY',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
      await fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`Are you sure you want to delete expense "${exp.title}"?`)) return;
    try {
      await api.delete(`/expenses/${exp.id}`);
      await fetchExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" /> Daily Costs & Expenses
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log daily operating costs (rent, electric bills, salaries, entertainment) for exact net profit calculation
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Daily Cost
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Period Expenses</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">৳{totalExpenseAmount.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-full text-rose-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Expense Entries</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{expenses.length} Records</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-full text-blue-600">
              <Tag className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchExpenses();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses by title or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-36"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-36"
            />
          </div>

          <Button type="submit" variant="secondary" className="w-full sm:w-auto">
            Filter
          </Button>
        </form>
      </Card>

      {/* Expenses Table */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading expenses...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[620px]">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Expense Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Note / Details</th>
                  <th className="p-3.5 text-right">Amount (৳)</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No expenses recorded for this criteria. Click "Add Daily Cost" to log an expense.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 text-muted-foreground text-xs">
                        {new Date(e.date).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-medium text-foreground">{e.title}</td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find((c) => c.value === e.category)?.label || e.category}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{e.note || '—'}</td>
                      <td className="p-3.5 text-right font-bold text-rose-600">
                        ৳{Number(e.amount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Add Daily Cost / Expense</DialogTitle>
            <DialogDescription>
              Record an operational expense for cash balance and balance sheet tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Expense Title *</label>
              <Input
                required
                placeholder="e.g. Electric Bill for Showroom, Staff Tea"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Amount (৳) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={form.amount === 0 ? '' : form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Date of Expense</label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Note / Reference (Optional)</label>
              <Input
                placeholder="Receipt #, Bill number, or voucher details"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
