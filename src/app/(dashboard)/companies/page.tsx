'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Company } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Search, Edit2, Trash2, Package } from 'lucide-react';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Company[]>('/companies', { search });
      setCompanies(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setForm({ name: '', description: '', isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setForm({
      name: comp.name,
      description: comp.description || '',
      isActive: comp.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingCompany) {
        await api.patch(`/companies/${editingCompany.id}`, form);
      } else {
        await api.post('/companies', form);
      }
      setModalOpen(false);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.message || 'Failed to save company.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (comp: Company) => {
    if (!confirm(`Are you sure you want to delete company "${comp.name}"?`)) return;
    try {
      await api.delete(`/companies/${comp.id}`);
      await fetchCompanies();
    } catch (err: any) {
      alert(err.message || 'Failed to delete company.');
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Companies / Brands
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage manufacturer brands (e.g., RFL, Kiam, Walton) linked to catalog products
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Company
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCompanies();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      {/* List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading companies...</div>
      ) : error ? (
        <div className="p-6 text-center text-destructive bg-destructive/10 rounded-lg">{error}</div>
      ) : companies.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No companies found. Click "Add Company" to create your first brand.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((comp) => (
            <Card key={comp.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg text-foreground">{comp.name}</h3>
                    <Badge variant={comp.isActive ? 'default' : 'secondary'}>
                      {comp.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {comp.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {comp.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{comp._count?.products || 0} Products</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(comp)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comp)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? 'Update company details and status'
                : 'Create a new manufacturer or brand for product categorization'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Company / Brand Name *</label>
              <Input
                required
                placeholder="e.g. RFL, Kiam, Walton"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
              <Input
                placeholder="Brief brand description or notes..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="compActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="compActive" className="text-xs font-medium text-foreground cursor-pointer">
                Active Brand
              </label>
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
              {isSaving ? 'Saving...' : editingCompany ? 'Update Company' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
