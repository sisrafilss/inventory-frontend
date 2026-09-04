'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Search, Filter, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { t, formatMoney } = useLanguage();
  const [activeReport, setActiveReport] = useState<
    'sales' | 'inventory' | 'adjustments' | 'performance' | 'cash'
  >('sales');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/sales';
      if (activeReport === 'inventory') endpoint = '/reports/inventory';
      else if (activeReport === 'adjustments') endpoint = '/reports/stock-adjustments';
      else if (activeReport === 'performance') endpoint = '/reports/sales-officers';
      else if (activeReport === 'cash') endpoint = '/reports/cash-handover';

      const res = await api.get<any>(endpoint, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      // Format response (some endpoints return { report, meta } or raw arrays)
      if (res.data?.report) {
        setData(res.data.report);
      } else if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const val = row[fieldName];
            const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeReport}-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> {t('reports.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('reports.subtitle')}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={loading || data.length === 0}
          className="gap-2 text-xs"
        >
          <Download className="w-4 h-4" /> {t('reports.exportCSV')}
        </Button>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {[
          { id: 'sales', label: t('reports.tabSales') },
          { id: 'inventory', label: t('reports.tabInventory') },
          { id: 'adjustments', label: t('reports.tabAdjustments') },
          { id: 'performance', label: t('reports.tabPerformance') },
          { id: 'cash', label: t('reports.tabCash') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeReport === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date filter bar (for date-applicable reports) */}
      {activeReport !== 'inventory' && (
        <Card className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchReport();
            }}
            className="flex flex-wrap items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">{t('reports.fromDate')}</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">{t('reports.toDate')}</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs">
              {t('reports.applyFilter')}
            </Button>
            {(startDate || endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="h-8 text-xs text-muted-foreground"
              >
                {t('reports.reset')}
              </Button>
            )}
          </form>
        </Card>
      )}

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('reports.generating')}</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('reports.noRecords')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeReport === 'sales' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('sales.refNumber')}</th>
                      <th className="p-3">{t('sales.date')}</th>
                      <th className="p-3">{t('reports.officer')}</th>
                      <th className="p-3">{t('sales.status')}</th>
                      <th className="p-3">{t('sales.approvedBy')}</th>
                      <th className="p-3 text-right">{t('sales.totalAmount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3 font-mono font-medium">{r.referenceNumber}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(r.date)}</td>
                        <td className="p-3 font-medium">{r.salesOfficer}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              r.status === 'APPROVED'
                                ? 'success'
                                : r.status === 'PENDING'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {r.status === 'APPROVED'
                              ? t('statuses.approved')
                              : r.status === 'PENDING'
                              ? t('statuses.pending')
                              : t('statuses.rejected')}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.approvedBy || '—'}</td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatMoney(r.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === 'inventory' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('inventory.sku')}</th>
                      <th className="p-3">{t('inventory.product')}</th>
                      <th className="p-3">{t('inventory.category')}</th>
                      <th className="p-3 text-center">{t('inventory.inStock')}</th>
                      <th className="p-3 text-right">{t('products.costPrice')}</th>
                      <th className="p-3 text-right">{t('products.sellingPrice')}</th>
                      <th className="p-3 text-right">{t('inventory.totalCostValue')}</th>
                      <th className="p-3">{t('inventory.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3 font-mono font-medium">{r.sku}</td>
                        <td className="p-3 font-semibold text-foreground">{r.name}</td>
                        <td className="p-3 text-muted-foreground">{r.category}</td>
                        <td className="p-3 text-center font-bold">
                          {r.currentQuantity} {r.unit}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {formatMoney(r.costPrice)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatMoney(r.sellingPrice)}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatMoney(r.totalCostValue)}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              r.stockStatus === 'IN_STOCK'
                                ? 'success'
                                : r.stockStatus === 'LOW_STOCK'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {r.stockStatus === 'IN_STOCK'
                              ? t('products.inStock')
                              : r.stockStatus === 'LOW_STOCK'
                              ? t('products.lowStock')
                              : t('products.outOfStock')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === 'adjustments' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('inventory.timestamp')}</th>
                      <th className="p-3">{t('inventory.product')}</th>
                      <th className="p-3">{t('inventory.movementType')}</th>
                      <th className="p-3 text-center">{t('inventory.change')}</th>
                      <th className="p-3 text-center">{t('inventory.beforeAfter')}</th>
                      <th className="p-3">{t('inventory.performedBy')}</th>
                      <th className="p-3">{t('inventory.reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3 text-muted-foreground">{formatDate(r.date)}</td>
                        <td className="p-3 font-medium text-foreground">{r.product}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {(t as any)(`inventory.movementTypes.${r.type}`) || r.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={
                              r.quantityChange > 0
                                ? 'text-emerald-600'
                                : r.quantityChange < 0
                                ? 'text-destructive'
                                : ''
                            }
                          >
                            {r.quantityChange > 0 ? `+${r.quantityChange}` : r.quantityChange} {r.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">
                          {r.quantityBefore} → <strong>{r.quantityAfter}</strong>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{r.performedBy}</span>
                          <span className="text-[10px] text-muted-foreground block uppercase">
                            {r.userRole}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === 'performance' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('reports.officer')}</th>
                      <th className="p-3 text-center">{t('reports.submitted')}</th>
                      <th className="p-3 text-center">{t('reports.approved')}</th>
                      <th className="p-3 text-center">{t('statuses.pending')}</th>
                      <th className="p-3 text-center">{t('reports.rejected')}</th>
                      <th className="p-3 text-right">{t('reports.approvedRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground block">{r.email}</span>
                        </td>
                        <td className="p-3 text-center font-medium">{r.totalSubmitted}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">
                          {r.approvedCount}
                        </td>
                        <td className="p-3 text-center font-medium text-amber-600">
                          {r.pendingCount}
                        </td>
                        <td className="p-3 text-center text-muted-foreground">{r.rejectedCount}</td>
                        <td className="p-3 text-right font-bold text-foreground text-sm">
                          {formatMoney(r.approvedSalesAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeReport === 'cash' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">{t('sales.refNumber')}</th>
                      <th className="p-3">{t('inventory.timestamp')}</th>
                      <th className="p-3">{t('reports.officer')}</th>
                      <th className="p-3">{t('reports.cashConfirmedBy')}</th>
                      <th className="p-3">{t('sales.customer')}</th>
                      <th className="p-3 text-right">{t('reports.handoverAmount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3 font-mono font-medium text-foreground">
                          {r.referenceNumber}
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(r.confirmedAt)}</td>
                        <td className="p-3 font-medium">{r.salesOfficer}</td>
                        <td className="p-3">
                          <span className="font-semibold text-emerald-700">{r.confirmedBy}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.customerName}</td>
                        <td className="p-3 text-right font-bold text-foreground text-sm font-mono">
                          {formatMoney(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

