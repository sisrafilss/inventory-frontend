'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useLanguage } from '@/lib/context/language-context';
import { Category } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Layers, Plus, Search, Edit2 } from 'lucide-react';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Category[]>('/categories', { search });
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

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', description: '', isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, form);
      } else {
        await api.post('/categories', form);
      }
      setModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> {t('categories.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('categories.subtitle')}
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> {t('categories.addCategory')}
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCategories();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('categories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="text-xs">
            {t('common.search')}
          </Button>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('common.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('categories.noCategories')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('categories.categoryName')}</th>
                    <th className="p-3">{t('products.description')}</th>
                    <th className="p-3">{t('categories.assignedProducts')}</th>
                    <th className="p-3">{t('common.status')}</th>
                    <th className="p-3">{t('users.created')}</th>
                    <th className="p-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/40">
                      <td className="p-3 font-semibold text-foreground">{cat.name}</td>
                      <td className="p-3 text-muted-foreground">{cat.description || '—'}</td>
                      <td className="p-3 font-medium">
                        {cat._count?.products || 0}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={cat.isActive ? 'success' : 'secondary'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {cat.isActive ? t('statuses.ACTIVE') : t('statuses.INACTIVE')}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(cat.createdAt)}</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> {t('common.edit')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogHeader>
          <DialogTitle>{editingCategory ? t('categories.editCategory') : t('categories.addCategory')}</DialogTitle>
          <DialogDescription>
            {editingCategory
              ? t('categories.subtitle')
              : t('categories.addCategory')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('categories.categoryName')} *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">{t('products.description')}</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Beverages, Electronics"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-input text-primary"
            />
            <label htmlFor="isActive" className="text-xs font-medium cursor-pointer">
              {t('categories.activeCategory')}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? t('common.submitting') : t('categories.saveCategory')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
