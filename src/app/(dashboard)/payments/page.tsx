'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { PartyPayment, Customer, Supplier } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BadgeDollarSign,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { EditCollectionPaidModal } from '@/components/payments/edit-collection-paid-modal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PartyPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER_COLLECTION' | 'SUPPLIER_PAYMENT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Collection OR Paid Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SALES' | 'PURCHASE'>('SALES');

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
            onClick={() => {
              setModalType('SALES');
              setModalOpen(true);
            }}
            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowDownLeft className="w-4 h-4" /> Collect from Customer
          </Button>
          <Button
            onClick={() => {
              setModalType('PURCHASE');
              setModalOpen(true);
            }}
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

      {/* Edit Collection OR Paid Modal */}
      <EditCollectionPaidModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialType={modalType}
        onSuccess={() => {
          fetchPayments();
          fetchParties();
        }}
      />
    </div>
  );
}
