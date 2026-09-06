'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Product, Category } from '@/lib/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Package, Plus, Search, Edit2, AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unit: 'piece',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    reorderLevel: 10,
    description: '',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>('/categories');
      setCategories(res.data);
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Product[]>('/products', {
        search,
        categoryId: categoryFilter || undefined,
        stockStatus: stockFilter !== 'ALL' ? stockFilter : undefined,
      });
      setProducts(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      unit: 'piece',
      costPrice: 0,
      sellingPrice: 0,
      quantity: 0,
      reorderLevel: 10,
      description: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      unit: p.unit,
      costPrice: p.costPrice ?? 0,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      reorderLevel: p.reorderLevel,
      description: p.description || '',
      isActive: p.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, {
          name: form.name,
          sku: form.sku,
          categoryId: form.categoryId,
          unit: form.unit,
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          reorderLevel: Number(form.reorderLevel),
          description: form.description,
          isActive: form.isActive,
        });
      } else {
        await api.post('/products', {
          ...form,
          costPrice: Number(form.costPrice),
          sellingPrice: Number(form.sellingPrice),
          quantity: Number(form.quantity),
          reorderLevel: Number(form.reorderLevel),
        });
      }
      setModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> {t('products.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('products.subtitle')}
          </p>
        </div>

        {canManage && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> {t('products.addProduct')}
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="">{t('products.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="ALL">{t('products.allStockStatuses')}</option>
              <option value="IN_STOCK">{t('products.inStock')}</option>
              <option value="LOW_STOCK">{t('products.lowStock')}</option>
              <option value="OUT_OF_STOCK">{t('products.outOfStock')}</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('products.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('products.noProducts')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[750px]">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('products.sku')}</th>
                    <th className="p-3">{t('products.name')}</th>
                    <th className="p-3">{t('products.category')}</th>
                    <th className="p-3">{t('products.unit')}</th>
                    {canManage && <th className="p-3 text-right">{t('products.costPrice')}</th>}
                    <th className="p-3 text-right">{t('products.sellingPrice')}</th>
                    <th className="p-3 text-center">{t('products.availableStock')}</th>
                    <th className="p-3">{t('products.status')}</th>
                    {canManage && <th className="p-3 text-right">{t('products.action')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="p-3 font-mono font-medium text-foreground">{p.sku}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {p.name}
                        {p.description && (
                          <p className="text-[10px] text-muted-foreground font-normal truncate max-w-xs">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{p.category?.name || '—'}</td>
                      <td className="p-3 text-muted-foreground">{p.unit}</td>
                      {canManage && (
                        <td className="p-3 text-right font-medium text-muted-foreground">
                          {p.costPrice !== undefined ? formatMoney(p.costPrice) : '—'}
                        </td>
                      )}
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatMoney(p.sellingPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-bold text-sm ${
                            p.quantity <= 0
                              ? 'text-destructive'
                              : p.quantity <= p.reorderLevel
                              ? 'text-amber-600'
                              : 'text-foreground'
                          }`}
                        >
                          {p.quantity}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">{p.unit}</span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            p.stockStatus === 'IN_STOCK'
                              ? 'success'
                              : p.stockStatus === 'LOW_STOCK'
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {p.stockStatus === 'IN_STOCK'
                            ? t('products.inStock')
                            : p.stockStatus === 'LOW_STOCK'
                            ? t('products.lowStock')
                            : t('products.outOfStock')}
                        </Badge>
                      </td>
                      {canManage && (
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" /> {t('products.edit')}
                          </Button>
                        </td>
                      )}
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
          <DialogTitle>{editingProduct ? t('products.dialogEditTitle') : t('products.dialogAddTitle')}</DialogTitle>
          <DialogDescription>
            {editingProduct
              ? t('products.dialogEditDesc')
              : t('products.dialogAddDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold">{t('products.name')} *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">{t('products.sku')} *</label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. BEV-WAT-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold">{t('products.category')} *</label>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value="">{t('products.selectCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold">{t('products.unit')} *</label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="piece, bottle, box, kg, ream"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold">{t('products.costPrice')} *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">{t('products.sellingPrice')} *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!editingProduct && (
              <div className="space-y-1">
                <label className="font-semibold">{t('products.initialQuantity')}</label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="font-semibold">{t('products.reorderLevel')} *</label>
              <Input
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value, 10) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold">{t('products.description')}</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Packaging notes, specifications, etc."
            />
          </div>

          {editingProduct && (
            <div className="p-2.5 bg-muted/40 rounded-lg text-muted-foreground flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>
                {t('products.adjustWarning')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="productActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-input text-primary"
            />
            <label htmlFor="productActive" className="font-medium cursor-pointer">
              {t('products.activeProduct')}
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
              {isSaving ? t('products.saving') : t('products.save')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}

