'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Search, Filter, Calendar } from 'lucide-react';

export default function ReportsPage() {
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
            <BarChart3 className="w-6 h-6 text-primary" /> Operational Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit inventory, track sales metrics, review cashier handovers, and evaluate staff performance
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={loading || data.length === 0}
          className="gap-2 text-xs"
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {[
          { id: 'sales', label: 'Sales Report' },
          { id: 'inventory', label: 'Product Inventory & Valuation' },
          { id: 'adjustments', label: 'Stock Movement Audits' },
          { id: 'performance', label: 'Sales Officer Performance' },
          { id: 'cash', label: 'Cash Handover Register' },
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
              <span className="font-semibold text-muted-foreground">From Date:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">To Date:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs">
              Apply Date Filter
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
                Reset
              </Button>
            )}
          </form>
        </Card>
      )}

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Generating report...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No report records found for this criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeReport === 'sales' && (
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b text-muted-foreground">
                    <tr className="text-left font-semibold">
                      <th className="p-3">Reference</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Sales Officer</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Approved By</th>
                      <th className="p-3 text-right">Total Amount</th>
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
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{r.approvedBy || '—'}</td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatCurrency(r.totalAmount)}
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
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">In Stock</th>
                      <th className="p-3 text-right">Cost Price</th>
                      <th className="p-3 text-right">Selling Price</th>
                      <th className="p-3 text-right">Total Cost Value</th>
                      <th className="p-3">Status</th>
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
                          {formatCurrency(r.costPrice)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(r.sellingPrice)}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatCurrency(r.totalCostValue)}
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
                            {r.stockStatus.replace('_', ' ')}
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
                      <th className="p-3">Date</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Movement Type</th>
                      <th className="p-3 text-center">Change</th>
                      <th className="p-3 text-center">Before → After</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="p-3 text-muted-foreground">{formatDate(r.date)}</td>
                        <td className="p-3 font-medium text-foreground">{r.product}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {r.type.replace('_', ' ')}
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
                      <th className="p-3">Sales Officer</th>
                      <th className="p-3 text-center">Submitted</th>
                      <th className="p-3 text-center">Approved</th>
                      <th className="p-3 text-center">Pending</th>
                      <th className="p-3 text-center">Rejected</th>
                      <th className="p-3 text-right">Approved Revenue</th>
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
                          {formatCurrency(r.approvedSalesAmount)}
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
                      <th className="p-3">Sale Reference</th>
                      <th className="p-3">Confirmed At</th>
                      <th className="p-3">Sales Officer</th>
                      <th className="p-3">Cash Handover Confirmed By</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 text-right">Handover Cash Amount</th>
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
                          {formatCurrency(r.amount)}
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

