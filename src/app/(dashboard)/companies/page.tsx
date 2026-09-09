'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Company } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { CompanyModal } from '@/components/companies/company-modal';

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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
    setModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setEditingCompany(comp);
    setModalOpen(true);
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
              placeholder="Search companies by name or code..."
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
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{comp.name}</h3>
                      {comp.code && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[11px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded border border-neutral-300 dark:border-neutral-700">
                          Code: {comp.code}
                        </span>
                      )}
                    </div>
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

      {/* Re-designed Desktop Company Modal */}
      <CompanyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        company={editingCompany}
        onSuccess={() => {
          fetchCompanies();
        }}
        onDelete={() => {
          fetchCompanies();
        }}
      />
    </div>
  );
}
