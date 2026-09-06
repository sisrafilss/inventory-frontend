'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { PartyPayment, Customer, Supplier } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  BadgeDollarSign,
  Plus,
  Search,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PartyPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER_COLLECTION' | 'SUPPLIER_PAYMENT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Collect from Customer Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectForm, setCollectForm] = useState({
    customerId: '',
    amount: 0,
    paymentMethod: 'CASH',
    referenceNote: '',
  });

  // Pay to Supplier Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    supplierId: '',
    amount: 0,
    paymentMethod: 'CASH',
    referenceNote: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get<PartyPayment[]>('/payments', {
        type: activeTab !== 'ALL' ? activeTab : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const [custRes, supRes] = await Promise.all([
        api.get<Customer[]>('/parties/customers'),
        api.get<Supplier[]>('/parties/suppliers'),
      ]);
      setCustomers(custRes.data);
      setSuppliers(supRes.data);
    } catch (err) {
      console.error('Failed to load parties:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchParties();
  }, [activeTab]);

  const totalCollections = payments
    .filter((p) => p.type === 'CUSTOMER_COLLECTION')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const totalPayouts = payments
    .filter((p) => p.type === 'SUPPLIER_PAYMENT')
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectForm.customerId || collectForm.amount <= 0) {
      alert('Please select a customer and enter an amount greater than 0.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/payments/customer-collection', {
        ...collectForm,
        amount: Number(collectForm.amount),
      });
      alert('Cash collection recorded and customer due reduced successfully!');
      setCollectModalOpen(false);
      setCollectForm({ customerId: '', amount: 0, paymentMethod: 'CASH', referenceNote: '' });
      await Promise.all([fetchPayments(), fetchParties()]);
    } catch (err: any) {
      alert(err.message || 'Failed to record collection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.supplierId || payForm.amount <= 0) {
      alert('Please select a supplier and enter an amount greater than 0.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.post('/payments/supplier-payment', {
        ...payForm,
        amount: Number(payForm.amount),
      });
      alert('Supplier payout recorded and supplier payable reduced successfully!');
      setPayModalOpen(false);
      setPayForm({ supplierId: '', amount: 0, paymentMethod: 'CASH', referenceNote: '' });
      await Promise.all([fetchPayments(), fetchParties()]);
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === collectForm.customerId);
  const selectedSupplier = suppliers.find((s) => s.id === payForm.supplierId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-primary" /> Collection & Paid (Cash Flow)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Collect money from customers (reduces customer credit due) and pay suppliers (reduces supplier dues)
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Button
            onClick={() => setCollectModalOpen(true)}
            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowDownLeft className="w-4 h-4" /> Collect from Customer
          </Button>
          <Button
            onClick={() => setPayModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            <ArrowUpRight className="w-4 h-4" /> Pay Supplier
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Customer Collections</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">৳{totalCollections.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Supplier Payouts</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">৳{totalPayouts.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-full text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net Cash Inflow</p>
              <h3
                className={`text-2xl font-bold mt-1 ${
                  totalCollections - totalPayouts >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                ৳{(totalCollections - totalPayouts).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Date Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex rounded-lg bg-muted p-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'ALL'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Receipts
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMER_COLLECTION')}
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'CUSTOMER_COLLECTION'
                ? 'bg-background text-emerald-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Customer Collections
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIER_PAYMENT')}
            className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'SUPPLIER_PAYMENT'
                ? 'bg-background text-rose-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Supplier Payouts
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-36 h-9"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-36 h-9"
          />
          <Button variant="secondary" size="sm" onClick={fetchPayments} className="w-full sm:w-auto">
            Filter
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading transaction ledger...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Party (Customer / Supplier)</th>
                  <th className="p-3.5 text-center">Method</th>
                  <th className="p-3.5">Reference Note</th>
                  <th className="p-3.5 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No payment or collection records found for this period.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isCollection = p.type === 'CUSTOMER_COLLECTION';
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono text-xs font-semibold text-foreground">
                          {p.receiptNumber}
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={isCollection ? 'default' : 'secondary'}
                            className={
                              isCollection
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                            }
                          >
                            {isCollection ? 'Customer Collection' : 'Supplier Payout'}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-foreground">
                            {isCollection
                              ? p.customer?.name || 'Customer'
                              : p.supplier?.name || 'Supplier'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isCollection ? p.customer?.phone : p.supplier?.phone}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="text-xs font-mono uppercase bg-muted px-2 py-0.5 rounded">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">{p.referenceNote || '—'}</td>
                        <td
                          className={`p-3.5 text-right font-bold ${
                            isCollection ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCollection ? '+' : '-'}৳{Number(p.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Customer Collection Dialog */}
      <Dialog open={collectModalOpen} onOpenChange={setCollectModalOpen}>
        <form onSubmit={handleCollectSubmit}>
          <DialogHeader>
            <DialogTitle className="text-emerald-600 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5" /> Collect Cash from Customer
            </DialogTitle>
            <DialogDescription>
              Record customer cash / online payment. This will atomically decrease customer dues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Customer *</label>
              <select
                required
                value={collectForm.customerId}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = customers.find((cust) => cust.id === id);
                  setCollectForm({
                    ...collectForm,
                    customerId: id,
                    amount: c && Number(c.currentDue) > 0 ? Number(c.currentDue) : collectForm.amount,
                  });
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Current Due: ৳{Number(c.currentDue).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 text-xs">
                <span className="text-muted-foreground">Current Outstanding Due: </span>
                <span className="font-bold text-emerald-600">
                  ৳{Number(selectedCustomer.currentDue).toLocaleString()}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Collected Amount (৳) *</label>
              <Input
                type="number"
                min="1"
                required
                value={collectForm.amount}
                onChange={(e) =>
                  setCollectForm({ ...collectForm, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <select
                value={collectForm.paymentMethod}
                onChange={(e) => setCollectForm({ ...collectForm, paymentMethod: e.target.value })}
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
              <label className="text-xs font-semibold text-foreground">Reference / Memo Note</label>
              <Input
                placeholder="Money receipt #, TrxID, or note"
                value={collectForm.referenceNote}
                onChange={(e) => setCollectForm({ ...collectForm, referenceNote: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCollectModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? 'Recording...' : 'Confirm Cash Collection'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Supplier Payout Dialog */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <form onSubmit={handlePaySubmit}>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" /> Pay Due to Supplier
            </DialogTitle>
            <DialogDescription>
              Record cash / bank payment to supplier. This will reduce your accounts payable debt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Supplier *</label>
              <select
                required
                value={payForm.supplierId}
                onChange={(e) => {
                  const id = e.target.value;
                  const s = suppliers.find((sup) => sup.id === id);
                  setPayForm({
                    ...payForm,
                    supplierId: id,
                    amount: s && Number(s.currentDue) > 0 ? Number(s.currentDue) : payForm.amount,
                  });
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select Supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.companyName ? `(${s.companyName})` : ''} - Owed: ৳{Number(s.currentDue).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedSupplier && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 text-xs">
                <span className="text-muted-foreground">Current Accounts Payable (We Owe): </span>
                <span className="font-bold text-rose-600">
                  ৳{Number(selectedSupplier.currentDue).toLocaleString()}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Amount (৳) *</label>
              <Input
                type="number"
                min="1"
                required
                value={payForm.amount}
                onChange={(e) =>
                  setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
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
              <label className="text-xs font-semibold text-foreground">Reference / Voucher Note</label>
              <Input
                placeholder="Cheque #, Bank deposit slip, or note"
                value={payForm.referenceNote}
                onChange={(e) => setPayForm({ ...payForm, referenceNote: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isProcessing ? 'Recording...' : 'Confirm Supplier Payout'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
