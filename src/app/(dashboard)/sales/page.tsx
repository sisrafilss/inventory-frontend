'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { Sale, SaleStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, PlusCircle, Search, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function SalesListPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
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
            {isSalesOfficer ? t('sales.mySales') : t('sales.allSales')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isSalesOfficer
              ? t('sales.subtitleMy')
              : t('sales.subtitleAll')}
          </p>
        </div>

        <Link href="/sales/new">
          <Button className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" /> {t('sales.createSale')}
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
              placeholder={t('sales.searchPlaceholder')}
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
              <option value="">{t('sales.allStatuses')}</option>
              <option value="PENDING">{t('sales.pendingReview')}</option>
              <option value="APPROVED">{t('sales.approvedDeducted')}</option>
              <option value="REJECTED">{t('sales.rejected')}</option>
            </Select>
          </div>
        </form>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('sales.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('sales.noSales')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('sales.refNumber')}</th>
                    <th className="p-3">{t('sales.date')}</th>
                    {!isSalesOfficer && <th className="p-3">{t('sales.salesOfficer')}</th>}
                    <th className="p-3">{t('sales.customer')}</th>
                    <th className="p-3">{t('sales.items')}</th>
                    <th className="p-3 text-right">{t('sales.totalAmount')}</th>
                    <th className="p-3">{t('sales.status')}</th>
                    <th className="p-3 text-right">{t('sales.action')}</th>
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
                          t('sales.walkIn')
                        )}
                      </td>
                      <td className="p-3 font-medium">{sale.items?.length || 0} {t('sales.lines')}</td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {formatMoney(sale.totalAmount)}
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
                          {sale.status === 'APPROVED'
                            ? t('statuses.approved')
                            : sale.status === 'PENDING'
                            ? t('statuses.pending')
                            : t('statuses.rejected')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setSelectedSale(sale)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> {t('sales.viewDetails')}
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
          <DialogTitle>{t('sales.saleDetails')}</DialogTitle>
          <DialogDescription>
            {t('sales.refNumber')}: <strong className="font-mono text-foreground">{selectedSale?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {selectedSale && (
          <div className="space-y-4 text-xs">
            {/* Meta details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.salesOfficer')}</span>
                <span className="font-semibold text-foreground">{selectedSale.salesOfficer?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.status')}</span>
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
                  {selectedSale.status === 'APPROVED'
                    ? t('statuses.approved')
                    : selectedSale.status === 'PENDING'
                    ? t('statuses.pending')
                    : t('statuses.rejected')}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.dateSubmitted')}</span>
                <span className="text-foreground">{formatDate(selectedSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.customer')}</span>
                <span className="text-foreground">{selectedSale.customerName || t('sales.walkIn')}</span>
              </div>
              {selectedSale.approvedBy && (
                <div>
                  <span className="text-muted-foreground block text-[10px]">{t('sales.approvedBy')}</span>
                  <span className="text-emerald-700 font-medium">
                    {selectedSale.approvedBy.name} ({formatDate(selectedSale.approvedAt!)})
                  </span>
                </div>
              )}
              {selectedSale.rejectedBy && (
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[10px]">{t('sales.rejectionReason')}</span>
                  <span className="text-destructive font-medium">
                    {selectedSale.rejectionReason} ({t('sales.rejected')} {selectedSale.rejectedBy.name})
                  </span>
                </div>
              )}
            </div>

            {/* Line items table */}
            <div>
              <h4 className="font-bold mb-1.5 text-foreground">{t('sales.itemsInSale')}</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left font-semibold text-muted-foreground">
                      <th className="p-2">{t('sales.product')}</th>
                      <th className="p-2 text-center">{t('sales.quantity')}</th>
                      <th className="p-2 text-right">{t('sales.unitPrice')}</th>
                      <th className="p-2 text-right">{t('sales.total')}</th>
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
                          {formatMoney(item.unitPrice)}
                        </td>
                        <td className="p-2 text-right font-semibold text-foreground">
                          {formatMoney(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/20 font-bold border-t">
                    <tr>
                      <td colSpan={3} className="p-2 text-right">
                        {t('sales.grandTotal')}:
                      </td>
                      <td className="p-2 text-right text-sm text-foreground">
                        {formatMoney(selectedSale.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedSale.note && (
              <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
                <strong>{t('sales.saleNote')}:</strong> {selectedSale.note}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                {t('sales.close')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}

