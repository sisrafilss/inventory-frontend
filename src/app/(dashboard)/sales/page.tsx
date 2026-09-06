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
import { ShoppingCart, PlusCircle, Search, Eye, Clock, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { InvoiceMemoModal } from '@/components/sales/invoice-memo-modal';

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

  // Memo Modal
  const [memoSale, setMemoSale] = useState<Sale | null>(null);
  const [memoOpen, setMemoOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {t('sales.allSales')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('sales.subtitleAll')}
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
              <option value="COMPLETED">{t('statuses.completed') || 'Completed'}</option>
              <option value="CANCELLED">{t('statuses.cancelled') || 'Cancelled'}</option>
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
              <table className="w-full text-xs min-w-[750px]">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('sales.refNumber')}</th>
                    <th className="p-3">{t('sales.date')}</th>
                    <th className="p-3">{t('sales.createdBy')}</th>
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
                      <td className="p-3 font-medium text-foreground">
                        {sale.createdBy?.name || '—'}
                      </td>
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
                          variant={sale.status === 'COMPLETED' ? 'success' : 'destructive'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {sale.status === 'COMPLETED'
                            ? t('statuses.completed') || 'Completed'
                            : t('statuses.cancelled') || 'Cancelled'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setMemoSale(sale);
                              setMemoOpen(true);
                            }}
                          >
                            <Printer className="w-3 h-3" /> Memo
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> {t('sales.viewDetails')}
                          </Button>
                        </div>
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
                <span className="text-muted-foreground block text-[10px]">{t('sales.createdBy')}</span>
                <span className="font-semibold text-foreground">{selectedSale.createdBy?.name || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.status')}</span>
                <Badge
                  variant={selectedSale.status === 'COMPLETED' ? 'success' : 'destructive'}
                  className="text-[10px] uppercase font-bold mt-0.5"
                >
                  {selectedSale.status === 'COMPLETED'
                    ? t('statuses.completed') || 'Completed'
                    : t('statuses.cancelled') || 'Cancelled'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.date')}</span>
                <span className="text-foreground">{formatDate(selectedSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">{t('sales.customer')}</span>
                <span className="text-foreground">{selectedSale.customerName || t('sales.walkIn')}</span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="font-bold mb-1.5 text-foreground">{t('sales.itemsInSale')}</h4>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs min-w-[380px]">
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

            <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs w-full sm:w-auto"
                onClick={() => {
                  setMemoSale(selectedSale);
                  setMemoOpen(true);
                }}
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice Memo
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setSelectedSale(null)}>
                {t('sales.close')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <InvoiceMemoModal
        sale={memoSale}
        open={memoOpen}
        onOpenChange={setMemoOpen}
      />
    </div>
  );
}

