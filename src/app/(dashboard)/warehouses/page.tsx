'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Warehouse, Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Warehouse as WarehouseIcon, Plus, Search, Edit2, ArrowRightLeft, MapPin, CheckCircle2 } from 'lucide-react';

export default function WarehousesPage() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', isDefault: false, isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: '',
    targetWarehouseId: '',
    productId: '',
    quantity: 1,
    note: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Warehouse[]>('/warehouses', { search });
      setWarehouses(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products', { limit: 200 });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products for transfer:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setForm({ name: '', address: '', isDefault: false, isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setForm({
      name: wh.name,
      address: wh.address || '',
      isDefault: wh.isDefault,
      isActive: wh.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingWarehouse) {
        await api.patch(`/warehouses/${editingWarehouse.id}`, form);
      } else {
        await api.post('/warehouses', form);
      }
      setModalOpen(false);
      await fetchWarehouses();
    } catch (err: any) {
      alert(err.message || 'Failed to save warehouse.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenTransfer = (defaultSourceId?: string) => {
    setTransferForm({
      sourceWarehouseId: defaultSourceId || warehouses[0]?.id || '',
      targetWarehouseId: warehouses.find((w) => w.id !== defaultSourceId)?.id || '',
      productId: products[0]?.id || '',
      quantity: 1,
      note: '',
    });
    setTransferModalOpen(true);
  };

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
      alert('Source and target warehouses cannot be the same.');
      return;
    }
    if (transferForm.quantity <= 0) {
      alert('Transfer quantity must be greater than 0.');
      return;
    }
    setIsTransferring(true);
    try {
      await api.post('/warehouses/transfer-stock', {
        ...transferForm,
        quantity: Number(transferForm.quantity),
      });
      alert('Stock transferred successfully!');
      setTransferModalOpen(false);
      await fetchWarehouses();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer stock.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <WarehouseIcon className="w-6 h-6 text-primary" /> Warehouses & Godowns
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-location inventory tracking (Warehouse 1, Warehouse 2) and stock transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenTransfer()}
            disabled={warehouses.length < 2 || products.length === 0}
            className="gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer Stock
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Warehouse
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchWarehouses();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouses by name or location..."
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

      {/* Warehouse Cards */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading warehouses...</div>
      ) : error ? (
        <div className="p-6 text-center text-destructive bg-destructive/10 rounded-lg">{error}</div>
      ) : warehouses.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No warehouses found. Click "Add Warehouse" to register your storage locations.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Card key={wh.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground flex items-center gap-1.5">
                        {wh.name}
                        {wh.isDefault && (
                          <span title="Default Sales & Restock Warehouse">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                          </span>
                        )}
                      </h3>
                      {wh.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {wh.address}
                        </p>
                      )}
                    </div>
                    <Badge variant={wh.isActive ? 'default' : 'secondary'}>
                      {wh.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {wh.isDefault ? 'Primary Warehouse' : 'Secondary Godown'}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTransfer(wh.id)}
                      className="text-xs h-8 gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(wh)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Warehouse Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? 'Update storage location details and default preferences'
                : 'Create a new warehouse or storage location for inventory management'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Warehouse Name *</label>
              <Input
                required
                placeholder="e.g. Warehouse 1, Main Godown"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Physical Address / Location</label>
              <Input
                placeholder="e.g. Road 4, Sector 7, Tongi, Gazipur"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="whDefault"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="whDefault" className="text-xs font-medium text-foreground cursor-pointer">
                Set as Default Warehouse for Sales & Restocking
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="whActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="whActive" className="text-xs font-medium text-foreground cursor-pointer">
                Active Location
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
              {isSaving ? 'Saving...' : editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <form onSubmit={handleTransferStock}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Transfer Stock Between Warehouses
            </DialogTitle>
            <DialogDescription>
              Move quantity from one warehouse location to another atomically with an audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">From Warehouse *</label>
                <select
                  required
                  value={transferForm.sourceWarehouseId}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">To Warehouse *</label>
                <select
                  required
                  value={transferForm.targetWarehouseId}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, targetWarehouseId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {warehouses
                    .filter((w) => w.id !== transferForm.sourceWarehouseId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Product to Move *</label>
              <select
                required
                value={transferForm.productId}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, productId: e.target.value })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (SKU: {p.sku}) - Total Qty: {p.quantity} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Transfer Quantity *</label>
              <Input
                type="number"
                min="1"
                required
                value={transferForm.quantity}
                onChange={(e) =>
                  setTransferForm({
                    ...transferForm,
                    quantity: parseInt(e.target.value, 10) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Transfer Note / Reason</label>
              <Input
                placeholder="e.g. Replenishment for showroom display"
                value={transferForm.note}
                onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferModalOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isTransferring}>
              {isTransferring ? 'Transferring...' : 'Execute Stock Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
