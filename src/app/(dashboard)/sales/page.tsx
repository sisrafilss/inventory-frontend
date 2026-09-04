'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { Sale, SaleStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, PlusCircle, Search, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function SalesListPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Sale Details Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Sale[]>('/sales', {
        search,
        status: statusFilter || undefined,
      });
      setSales(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const isSalesOfficer = user?.role === 'SALES_OFFICER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {isSalesOfficer ? 'My Sales Entries' : 'All Sales Records'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSalesOfficer
              ? 'Track your submitted sales and review approval status'
              : 'Complete sales register across all staff members'}
          </p>
        </div>

        <Link href="/sales/new">
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" /> Create New Sale
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchSales();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3"
        >
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by reference number, customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-9"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved & Deducted</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading sales records...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No sales entries found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">Reference #</th>
                    <th className="p-3">Date</th>
                    {!isSalesOfficer && <th className="p-3">Sales Officer</th>}
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/40">
                      <td className="p-3 font-mono font-medium text-foreground">
                        {sale.referenceNumber}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                      {!isSalesOfficer && (
                        <td className="p-3 font-medium text-foreground">
                          {sale.salesOfficer?.name || '—'}
                        </td>
                      )}
                      <td className="p-3 text-muted-foreground">
                        {sale.customerName ? (
                          <>
                            <span className="font-medium text-foreground">{sale.customerName}</span>
                            {sale.customerPhone && (
                              <span className="text-[10px] block">{sale.customerPhone}</span>
                            )}
                          </>
                        ) : (
                          'Walk-in Customer'
                        )}
                      </td>
                      <td className="p-3 font-medium">{sale.items?.length || 0} line(s)</td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            sale.status === 'APPROVED'
                              ? 'success'
                              : sale.status === 'PENDING'
                              ? 'warning'
                              : 'destructive'
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View Details
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

      {/* Sale Details Modal */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
          <DialogDescription>
            Reference: <strong className="font-mono text-foreground">{selectedSale?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {selectedSale && (
          <div className="space-y-4 text-xs">
            {/* Meta details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-[10px]">Sales Officer</span>
                <span className="font-semibold text-foreground">{selectedSale.salesOfficer?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Status</span>
                <Badge
                  variant={
                    selectedSale.status === 'APPROVED'
                      ? 'success'
                      : selectedSale.status === 'PENDING'
                      ? 'warning'
                      : 'destructive'
                  }
                  className="text-[10px] uppercase font-bold mt-0.5"
                >
                  {selectedSale.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Date Submitted</span>
                <span className="text-foreground">{formatDate(selectedSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Customer</span>
                <span className="text-foreground">{selectedSale.customerName || 'Walk-in'}</span>
              </div>
              {selectedSale.approvedBy && (
                <div>
                  <span className="text-muted-foreground block text-[10px]">Approved By</span>
                  <span className="text-emerald-700 font-medium">
                    {selectedSale.approvedBy.name} ({formatDate(selectedSale.approvedAt!)})
                  </span>
                </div>
              )}
              {selectedSale.rejectedBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[10px]">Rejection Reason</span>
                  <span className="text-destructive font-medium">
                    {selectedSale.rejectionReason} (by {selectedSale.rejectedBy.name})
                  </span>
                </div>
              )}
            </div>

            {/* Line items table */}
            <div>
              <h4 className="font-bold mb-1.5 text-foreground">Items in this Sale</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left font-semibold text-muted-foreground">
                      <th className="p-2">Product</th>
                      <th className="p-2 text-center">Quantity</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedSale.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <span className="font-medium text-foreground">{item.product?.name}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            {item.product?.sku}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-right text-muted-foreground">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="p-2 text-right font-semibold text-foreground">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/20 font-bold border-t">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">
                        Grand Total:
                      </td>
                      <td className="p-2 text-right text-sm text-foreground">
                        {formatCurrency(selectedSale.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedSale.note && (
              <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
                <strong>Sale Note:</strong> {selectedSale.note}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}

