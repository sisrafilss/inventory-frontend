'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Supplier, Customer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Contact,
  Plus,
  Search,
  Edit2,
  Users,
  Truck,
  DollarSign,
  CreditCard,
  Phone,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function PartiesPage() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Supplier Add / Edit Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    openingDue: 0,
    isActive: true,
  });

  // Customer Add / Edit Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingDue: 0,
    isActive: true,
  });

  // Payment / Collection Quick Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'COLLECT' | 'PAY'>('COLLECT');
  const [selectedParty, setSelectedParty] = useState<{ id: string; name: string; due: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get<Supplier[]>('/parties/suppliers', { search });
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get<Customer[]>('/parties/customers', { search });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSuppliers(), fetchCustomers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSupplierDue = suppliers.reduce((acc, s) => acc + Number(s.currentDue), 0);
  const totalCustomerDue = customers.reduce((acc, c) => acc + Number(c.currentDue), 0);

  // Supplier Handlers
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      openingDue: 0,
      isActive: true,
    });
    setSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      companyName: s.companyName || '',
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      openingDue: Number(s.openingDue),
      isActive: s.isActive,
    });
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await api.patch(`/parties/suppliers/${editingSupplier.id}`, supplierForm);
      } else {
        await api.post('/parties/suppliers', supplierForm);
      }
      setSupplierModalOpen(false);
      await fetchSuppliers();
    } catch (err: any) {
      alert(err.message || 'Failed to save supplier.');
    } finally {
      setIsSaving(false);
    }
  };

  // Customer Handlers
  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      openingDue: 0,
      isActive: true,
    });
    setCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      openingDue: Number(c.openingDue),
      isActive: c.isActive,
    });
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCustomer) {
        await api.patch(`/parties/customers/${editingCustomer.id}`, customerForm);
      } else {
        await api.post('/parties/customers', customerForm);
      }
      setCustomerModalOpen(false);
      await fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Payment / Collection Quick Actions
  const handleOpenPaySupplier = (s: Supplier) => {
    setPaymentType('PAY');
    setSelectedParty({ id: s.id, name: s.name, due: Number(s.currentDue) });
    setPaymentAmount(Number(s.currentDue) > 0 ? Number(s.currentDue) : 0);
    setPaymentMethod('CASH');
    setPaymentNote('');
    setPaymentModalOpen(true);
  };

  const handleOpenCollectCustomer = (c: Customer) => {
    setPaymentType('COLLECT');
    setSelectedParty({ id: c.id, name: c.name, due: Number(c.currentDue) });
    setPaymentAmount(Number(c.currentDue) > 0 ? Number(c.currentDue) : 0);
    setPaymentMethod('CASH');
    setPaymentNote('');
    setPaymentModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || !selectedParty) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    setIsProcessingPayment(true);
    try {
      if (paymentType === 'PAY') {
        await api.post('/payments/supplier-payment', {
          supplierId: selectedParty.id,
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNote: paymentNote,
        });
        alert('Supplier payment recorded successfully!');
      } else {
        await api.post('/payments/customer-collection', {
          customerId: selectedParty.id,
          amount: Number(paymentAmount),
          paymentMethod,
          referenceNote: paymentNote,
        });
        alert('Customer collection recorded successfully!');
      }
      setPaymentModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to process payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Contact className="w-6 h-6 text-primary" /> Suppliers & Customers
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Address book, accounts payable (Supplier Dues) & accounts receivable (Customer Dues)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'suppliers' ? (
            <Button onClick={handleOpenCreateSupplier} className="gap-2">
              <Plus className="w-4 h-4" /> Add Supplier
            </Button>
          ) : (
            <Button onClick={handleOpenCreateCustomer} className="gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Supplier Payables (We Owe)</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">৳{totalSupplierDue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-full text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Customer Receivables (Owed to Us)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">৳{totalCustomerDue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net Receivable / Payable</p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  totalCustomerDue - totalSupplierDue >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                ৳{(totalCustomerDue - totalSupplierDue).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-full text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex rounded-lg bg-muted p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Customers ({customers.length})
          </button>
        </div>

        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (activeTab === 'suppliers') fetchSuppliers();
                else fetchCustomers();
              }
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tables */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading directory...</div>
      ) : activeTab === 'suppliers' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Company / Agency</th>
                  <th className="p-3.5">Phone & Contact</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5 text-right">Current Due (Payable)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No suppliers found. Click "Add Supplier" to register vendor.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">{s.name}</td>
                      <td className="p-3.5 text-muted-foreground">{s.companyName || '—'}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-foreground">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {s.phone}
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{s.address || '—'}</td>
                      <td className="p-3.5 text-right font-bold text-rose-600">
                        ৳{Number(s.currentDue).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant={s.isActive ? 'default' : 'secondary'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPaySupplier(s)}
                            className="h-8 text-xs gap-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay Due
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditSupplier(s)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Address</th>
                  <th className="p-3.5 text-right">Current Due (Receivable)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No customers found. Click "Add Customer" to create an account.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">{c.name}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-foreground">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {c.phone}
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{c.address || '—'}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600">
                        ৳{Number(c.currentDue).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant={c.isActive ? 'default' : 'secondary'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCollectCustomer(c)}
                            className="h-8 text-xs gap-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Collect Cash
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditCustomer(c)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Supplier Dialog */}
      <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
        <form onSubmit={handleSaveSupplier}>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription>
              Register vendor contact information and starting balance dues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Supplier Name *</label>
                <Input
                  required
                  placeholder="e.g. Md. Rafiqul Islam"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Company / Brand Represented</label>
                <Input
                  placeholder="e.g. RFL Plastics Dealer"
                  value={supplierForm.companyName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phone Number *</label>
                <Input
                  required
                  placeholder="017XXXXXXXX"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="supplier@mail.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Office / Shop Address</label>
              <Input
                placeholder="Market, Shop #, City"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>

            {!editingSupplier && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Opening Due (৳ Previous Debt)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={supplierForm.openingDue}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      openingDue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSupplierModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <form onSubmit={handleSaveCustomer}>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              Register retail/wholesale customer account for credit & cash tracking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Customer Name *</label>
                <Input
                  required
                  placeholder="e.g. Al-Amin Traders"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Phone Number *</label>
                <Input
                  required
                  placeholder="01XXXXXXXXX"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Address / Market Location</label>
              <Input
                placeholder="Village/Area, Thana, District"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              />
            </div>

            {!editingCustomer && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Opening Due (৳ Previous Credit)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={customerForm.openingDue}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      openingDue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomerModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Quick Payment / Collection Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <form onSubmit={handleExecutePayment}>
          <DialogHeader>
            <DialogTitle>
              {paymentType === 'PAY'
                ? `Pay Due to Supplier: ${selectedParty?.name}`
                : `Collect Cash from Customer: ${selectedParty?.name}`}
            </DialogTitle>
            <DialogDescription>
              {paymentType === 'PAY'
                ? `Current outstanding balance owed: ৳${selectedParty?.due.toLocaleString()}`
                : `Current receivable credit due: ৳${selectedParty?.due.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Amount (৳) *</label>
              <Input
                type="number"
                min="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reference / Transaction Note</label>
              <Input
                placeholder="e.g. Money receipt #104, bKash TrxID"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessingPayment}>
              {isProcessingPayment
                ? 'Processing...'
                : paymentType === 'PAY'
                ? 'Confirm Supplier Payout'
                : 'Confirm Cash Collection'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
