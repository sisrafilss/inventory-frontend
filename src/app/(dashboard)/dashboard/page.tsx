'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { api } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Package,
  Layers,
  Boxes,
  DollarSign,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval modal state
  const [selectedSaleForApproval, setSelectedSaleForApproval] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection modal state
  const [selectedSaleForRejection, setSelectedSaleForRejection] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApproveSale = async () => {
    if (!selectedSaleForApproval) return;
    setIsApproving(true);
    try {
      await api.post(`/sales/${selectedSaleForApproval.id}/approve`);
      setSelectedSaleForApproval(null);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to approve sale.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSale = async () => {
    if (!selectedSaleForRejection || !rejectionReason.trim()) return;
    setIsRejecting(true);
    try {
      await api.post(`/sales/${selectedSaleForRejection.id}/reject`, {
        reason: rejectionReason,
      });
      setSelectedSaleForRejection(null);
      setRejectionReason('');
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to reject sale.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleQuickVerifyUser = async (userId: string) => {
    if (!confirm('Verify and activate this Sales Officer?')) return;
    try {
      await api.post(`/users/${userId}/verify`);
      await fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to verify user.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading operational metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <Button onClick={fetchDashboard} size="sm" variant="outline">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  const isSalesOfficer = user?.role === 'SALES_OFFICER';
  const isManager = user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational dashboard & active queues for{' '}
            <span className="font-semibold text-foreground uppercase">{user?.role.replace('_', ' ')}</span>
          </p>
        </div>

        {isSalesOfficer && (
          <Link href="/sales/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" /> Create New Sale
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSalesOfficer ? (
          <>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">My Pending Sales</p>
                <h4 className="text-xl font-bold text-foreground">{data.stats.pendingSalesCount}</h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Approved Sales</p>
                <h4 className="text-xl font-bold text-foreground">{data.stats.todayApprovedCount}</h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Sales Revenue</p>
                <h4 className="text-xl font-bold text-foreground">
                  {formatCurrency(data.stats.todaySalesAmount)}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Month Sales Total</p>
                <h4 className="text-xl font-bold text-foreground">
                  {formatCurrency(data.stats.monthSalesAmount)}
                </h4>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Sales Queue</p>
                <h4 className="text-xl font-bold text-foreground">{data.stats.pendingSalesCount}</h4>
              </div>
            </Card>

            {isAdmin && (
              <Card className="p-4 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Registrations</p>
                  <h4 className="text-xl font-bold text-foreground">
                    {data.stats.pendingRegistrationsCount || 0}
                  </h4>
                </div>
              </Card>
            )}

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Sales Value</p>
                <h4 className="text-xl font-bold text-foreground">
                  {formatCurrency(data.stats.todaySalesAmount)}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low & Out of Stock</p>
                <h4 className="text-xl font-bold text-foreground">
                  {data.stats.lowStockCount + data.stats.outOfStockCount}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Stock Quantity</p>
                <h4 className="text-xl font-bold text-foreground">{data.stats.inventoryQuantity}</h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Est. Cost Valuation</p>
                <h4 className="text-xl font-bold text-foreground">
                  {formatCurrency(data.stats.inventoryCostValue)}
                </h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Products</p>
                <h4 className="text-xl font-bold text-foreground">{data.stats.productsCount}</h4>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Month Sales Total</p>
                <h4 className="text-xl font-bold text-foreground">
                  {formatCurrency(data.stats.monthSalesAmount)}
                </h4>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Action Queue: Pending Sales for Admin & Manager */}
      {!isSalesOfficer && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending Sales Review & Cash Handover Queue
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sales awaiting cash verification and final stock deduction
              </p>
            </div>
            <Link href="/sales/pending">
              <Button variant="outline" size="sm" className="text-xs">
                View Full Queue
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data.pendingSalesQueue || data.pendingSalesQueue.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No sales currently awaiting approval.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground font-semibold">
                      <th className="pb-2">Ref #</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Sales Officer</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.pendingSalesQueue.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-muted/40">
                        <td className="py-2.5 font-mono font-medium text-foreground">
                          {sale.referenceNumber}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                        <td className="py-2.5 font-medium">{sale.salesOfficer?.name}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {sale.customerName || 'Walk-in'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-foreground">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setSelectedSaleForApproval(sale)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Handover
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => setSelectedSaleForRejection(sale)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
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
      )}

      {/* Recent Sales List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">
              {isSalesOfficer ? 'My Recent Sales' : 'Recent Sales Activity'}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest transactions recorded in the system
            </p>
          </div>
          <Link href="/sales">
            <Button variant="outline" size="sm" className="text-xs">
              View All Sales
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!data.recentSales || data.recentSales.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No sales records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground font-semibold">
                    <th className="pb-2">Reference</th>
                    <th className="pb-2">Date</th>
                    {!isSalesOfficer && <th className="pb-2">Sales Officer</th>}
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-muted/40">
                      <td className="py-2.5 font-mono font-medium text-foreground">
                        {sale.referenceNumber}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                      {!isSalesOfficer && (
                        <td className="py-2.5 font-medium">{sale.salesOfficer?.name}</td>
                      )}
                      <td className="py-2.5">
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
                      <td className="py-2.5 text-right font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog: Cash Handover & Approval */}
      <Dialog
        open={!!selectedSaleForApproval}
        onOpenChange={(open) => !open && setSelectedSaleForApproval(null)}
      >
        <DialogHeader>
          <DialogTitle>Confirm Cash Handover & Approve Sale</DialogTitle>
          <DialogDescription>
            Reference: <strong>{selectedSaleForApproval?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Sale Amount:</span>
            <span className="font-bold text-foreground text-sm">
              {formatCurrency(selectedSaleForApproval?.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sales Officer:</span>
            <span className="font-semibold text-foreground">
              {selectedSaleForApproval?.salesOfficer?.name}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
            ⚠️ <strong>Important:</strong> Clicking confirm certifies that the exact cash amount has been
            physically received. Inventory will immediately and permanently be deducted in the database.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSaleForApproval(null)}
            disabled={isApproving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            onClick={handleApproveSale}
            disabled={isApproving}
          >
            {isApproving ? 'Processing Approval...' : 'Confirm Cash Received & Approve'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirmation Dialog: Reject Sale */}
      <Dialog
        open={!!selectedSaleForRejection}
        onOpenChange={(open) => !open && setSelectedSaleForRejection(null)}
      >
        <DialogHeader>
          <DialogTitle>Reject Sale Entry</DialogTitle>
          <DialogDescription>
            Reference: <strong>{selectedSaleForRejection?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            Rejection Reason (Required)
          </label>
          <textarea
            className="w-full h-20 p-2 text-xs border rounded-md border-input bg-transparent focus:ring-1 focus:ring-ring"
            placeholder="Explain why this sale is rejected..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSaleForRejection(null)}
            disabled={isRejecting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRejectSale}
            disabled={isRejecting || !rejectionReason.trim()}
          >
            {isRejecting ? 'Rejecting...' : 'Reject Sale'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

