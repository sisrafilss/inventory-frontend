'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Purchase } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Truck,
  Plus,
  Search,
  Eye,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // View modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get<Purchase[]>('/purchases', {
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPurchases(res.data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const totalPurchases = purchases.reduce((acc, p) => acc + Number(p.totalAmount), 0);
  const totalPaid = purchases.reduce((acc, p) => acc + Number(p.paidAmount), 0);
  const totalDue = purchases.reduce((acc, p) => acc + Number(p.dueAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Purchase Invoices
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record goods received from suppliers with DP rate, commission %, and stock replenishment
          </p>
        </div>

        <Link href="/purchases/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Purchase Entry
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Purchases Value</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">৳{totalPurchases.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Cash Paid</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">৳{totalPaid.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Supplier Credit / Due</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">৳{totalDue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-full text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPurchases();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or supplier name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

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

      {/* Purchases Table */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading purchase invoices...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier / Vendor</th>
                  <th className="p-3.5 text-center">Payment Type</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Due</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No purchase records found. Click "New Purchase Entry" to receive stock.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground font-mono text-xs">
                        {p.invoiceNumber}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-foreground">
                          {p.supplier?.name || p.supplierName || 'Direct / Cash'}
                        </div>
                        {p.supplier?.companyName && (
                          <div className="text-xs text-muted-foreground">{p.supplier.companyName}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant={p.paymentType === 'CASH' ? 'default' : 'secondary'}>
                          {p.paymentType === 'CASH' ? 'Cash' : 'Supplier Credit'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-bold text-foreground">
                        ৳{Number(p.totalAmount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-medium">
                        ৳{Number(p.paidAmount).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        {Number(p.dueAmount) > 0 ? (
                          <span className="font-bold text-rose-600">
                            ৳{Number(p.dueAmount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium">Paid</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPurchase(p)}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
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

      {/* View Purchase Dialog */}
      <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        {selectedPurchase && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice: {selectedPurchase.invoiceNumber}</span>
                <Badge variant={selectedPurchase.paymentType === 'CASH' ? 'default' : 'secondary'}>
                  {selectedPurchase.paymentType}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Recorded on {new Date(selectedPurchase.createdAt).toLocaleString()} by{' '}
                {selectedPurchase.createdBy?.name || 'Admin'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/40 p-3 rounded-md">
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">
                    {selectedPurchase.supplier?.name || selectedPurchase.supplierName || 'Direct / Cash'}
                  </p>
                  {selectedPurchase.supplier?.phone && (
                    <p className="text-muted-foreground">{selectedPurchase.supplier.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Financial Status:</span>
                  <p className="text-foreground font-medium mt-0.5">
                    Total: ৳{Number(selectedPurchase.totalAmount).toLocaleString()}
                  </p>
                  <p className="text-rose-600 font-bold">
                    Due: ৳{Number(selectedPurchase.dueAmount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-md overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[480px]">
                  <thead className="bg-muted border-b border-border text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-right">DP Rate</th>
                      <th className="p-2.5 text-right">Comm %</th>
                      <th className="p-2.5 text-right">Net Rate</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPurchase.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-foreground">
                          {item.product?.name || 'Product'}
                          <span className="text-muted-foreground ml-1">({item.product?.sku})</span>
                        </td>
                        <td className="p-2.5 text-right">৳{Number(item.dpRate).toFixed(2)}</td>
                        <td className="p-2.5 text-right">{Number(item.commissionPercent)}%</td>
                        <td className="p-2.5 text-right font-medium">৳{Number(item.purchaseRate).toFixed(2)}</td>
                        <td className="p-2.5 text-center font-semibold">{item.quantity}</td>
                        <td className="p-2.5 text-right font-bold">৳{Number(item.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPurchase.note && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded border border-border">
                  <span className="font-semibold text-foreground">Note: </span>
                  {selectedPurchase.note}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPurchase(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
