'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-center space-y-3">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <Button onClick={fetchDashboard} size="sm" variant="outline">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('dashboard.welcome')}, {user?.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.subtitle')}{' '}
            <span className="font-semibold text-foreground uppercase">{t(`roles.${user?.role}`)}</span>
          </p>
        </div>

        <Link href="/sales/new">
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" /> {t('sales.createSale')}
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.pendingSalesQueue')}</p>
            <h4 className="text-xl font-bold text-foreground">{data.stats.pendingSalesCount}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.todaySalesValue')}</p>
            <h4 className="text-xl font-bold text-foreground">
              {formatMoney(data.stats.todaySalesAmount)}
            </h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.lowOutOfStock')}</p>
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
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.totalStockQuantity')}</p>
            <h4 className="text-xl font-bold text-foreground">{data.stats.inventoryQuantity}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.estCostValuation')}</p>
            <h4 className="text-xl font-bold text-foreground">
              {formatMoney(data.stats.inventoryCostValue)}
            </h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.activeProducts')}</p>
            <h4 className="text-xl font-bold text-foreground">{data.stats.productsCount}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.monthSalesTotal')}</p>
            <h4 className="text-xl font-bold text-foreground">
              {formatMoney(data.stats.monthSalesAmount)}
            </h4>
          </div>
        </Card>
      </div>

      {/* Action Queue: Pending Sales for Admin & Manager */}
      <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> {t('dashboard.pendingQueueTitle')}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('dashboard.pendingQueueDesc')}
              </p>
            </div>
            <Link href="/sales/pending">
              <Button variant="outline" size="sm" className="text-xs">
                {t('dashboard.viewFullQueue')}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!data.pendingSalesQueue || data.pendingSalesQueue.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                {t('dashboard.noPendingSales')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground font-semibold">
                      <th className="pb-2">{t('dashboard.refNumber')}</th>
                      <th className="pb-2">{t('common.date')}</th>
                      <th className="pb-2">{t('common.createdBy')}</th>
                      <th className="pb-2">{t('dashboard.customer')}</th>
                      <th className="pb-2 text-right">{t('dashboard.amount')}</th>
                      <th className="pb-2 text-right">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.pendingSalesQueue.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-muted/40">
                        <td className="py-2.5 font-mono font-medium text-foreground">
                          {sale.referenceNumber}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                        <td className="py-2.5 font-medium">{sale.createdBy?.name || '—'}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {sale.customerName || t('common.walkIn')}
                        </td>
                        <td className="py-2.5 text-right font-bold text-foreground font-mono">
                          {formatMoney(sale.totalAmount)}
                        </td>
                        <td className="py-2.5 text-right space-x-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setSelectedSaleForApproval(sale)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {t('dashboard.approveAndHandover')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => setSelectedSaleForRejection(sale)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> {t('dashboard.reject')}
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

      {/* Recent Sales List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold">
              {t('dashboard.recentSalesTitle')}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('dashboard.recentSalesDesc')}
            </p>
          </div>
          <Link href="/sales">
            <Button variant="outline" size="sm" className="text-xs">
              {t('dashboard.viewAllSales')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!data.recentSales || data.recentSales.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              {t('dashboard.noSalesFound')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground font-semibold">
                    <th className="pb-2">{t('dashboard.refNumber')}</th>
                    <th className="pb-2">{t('common.date')}</th>
                    <th className="pb-2">{t('common.createdBy')}</th>
                    <th className="pb-2">{t('common.status')}</th>
                    <th className="pb-2 text-right">{t('dashboard.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentSales.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-muted/40">
                      <td className="py-2.5 font-mono font-medium text-foreground">
                        {sale.referenceNumber}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                      <td className="py-2.5 font-medium">{sale.createdBy?.name || '—'}</td>
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
                          {t(`statuses.${sale.status}`)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right font-bold text-foreground font-mono">
                        {formatMoney(sale.totalAmount)}
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
          <DialogTitle>{t('dashboard.confirmHandoverTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.refNumber')}: <strong>{selectedSaleForApproval?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('sales.totalCashRequired')}:</span>
            <span className="font-bold text-foreground text-sm font-mono">
              {formatMoney(selectedSaleForApproval?.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('common.createdBy')}:</span>
            <span className="font-semibold text-foreground">
              {selectedSaleForApproval?.createdBy?.name || '—'}
            </span>
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
            {t('dashboard.confirmHandoverNotice')}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedSaleForApproval(null)}
            disabled={isApproving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            onClick={handleApproveSale}
            disabled={isApproving}
          >
            {isApproving ? t('common.submitting') : t('dashboard.confirmButton')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Confirmation Dialog: Reject Sale */}
      <Dialog
        open={!!selectedSaleForRejection}
        onOpenChange={(open) => !open && setSelectedSaleForRejection(null)}
      >
        <DialogHeader>
          <DialogTitle>{t('dashboard.rejectSaleTitle')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.refNumber')}: <strong>{selectedSaleForRejection?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground">
            {t('dashboard.rejectionReason')}
          </label>
          <textarea
            className="w-full h-20 p-2 text-xs border rounded-md border-input bg-transparent focus:ring-1 focus:ring-ring"
            placeholder={t('dashboard.rejectionPlaceholder')}
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
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleRejectSale}
            disabled={isRejecting || !rejectionReason.trim()}
          >
            {isRejecting ? t('common.submitting') : t('dashboard.reject')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
