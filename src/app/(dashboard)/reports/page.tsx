'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Download,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Warehouse,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  Truck,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();

  const [activeReport, setActiveReport] = useState<string>('daily-sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceLookup, setInvoiceLookup] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/sales';
      const params: any = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      if (activeReport === 'daily-sales') {
        endpoint = '/reports/daily-sales';
        if (startDate) params.date = startDate;
      } else if (activeReport === 'due-list') {
        endpoint = '/reports/due-list';
      } else if (activeReport === 'warehouse-stock') {
        endpoint = '/reports/warehouse-stock';
      } else if (activeReport === 'daily-purchases') {
        endpoint = '/reports/daily-purchases';
      } else if (activeReport === 'daily-costs') {
        endpoint = '/reports/daily-costs';
      } else if (activeReport === 'profit-by-invoice') {
        endpoint = `/reports/profit-by-invoice/${invoiceLookup || 'SAL-latest'}`;
      } else if (activeReport === 'balance-sheet') {
        endpoint = '/reports/balance-sheet';
      } else if (activeReport === 'inventory') {
        endpoint = '/reports/inventory';
      } else if (activeReport === 'adjustments') {
        endpoint = '/reports/stock-adjustments';
      } else if (activeReport === 'cash') {
        endpoint = '/reports/cash-handover';
      }

      const res = await api.get<any>(endpoint, params);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const reportTabs = [
    { id: 'daily-sales', label: 'Daily Sales Statement' },
    { id: 'due-list', label: 'Due List (AP & AR)' },
    { id: 'warehouse-stock', label: 'Warehouse Stock' },
    { id: 'daily-purchases', label: 'Daily Purchases' },
    { id: 'daily-costs', label: 'Daily Costs / Expenses' },
    { id: 'inventory', label: 'Catalog Stock Status' },
    { id: 'sales', label: 'Sales History' },
    { id: 'cash', label: 'Cash Handover' },
    { id: 'adjustments', label: 'Stock Adjustments' },
    ...(isAdmin
      ? [
          { id: 'profit-by-invoice', label: 'Profit by Invoice (Admin)' },
          { id: 'balance-sheet', label: 'Balance Sheet (Admin)' },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Reports & Commercial Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time balance sheet, daily sales statements, due ledgers, and inventory distribution
          </p>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-2">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
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

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchReport();
          }}
          className="flex flex-wrap items-center gap-3 text-xs"
        >
          {activeReport === 'profit-by-invoice' ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-muted-foreground">Invoice Reference #:</span>
              <Input
                placeholder="e.g. SAL-123456-7890"
                value={invoiceLookup}
                onChange={(e) => setInvoiceLookup(e.target.value)}
                className="h-9 text-xs w-64"
              />
              <Button type="submit" size="sm">
                Lookup Profit
              </Button>
            </div>
          ) : (
            <>
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
                Filter
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
            </>
          )}
        </form>
      </Card>

      {/* Main Report Content */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground text-xs">Generating report data...</div>
      ) : !data ? (
        <Card className="p-12 text-center text-muted-foreground text-xs">
          No records found or unauthorized for this report view.
        </Card>
      ) : (
        <div>
          {/* TAB 1: DAILY SALES STATEMENT */}
          {activeReport === 'daily-sales' && (
            <div className="space-y-4">
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-primary">
                  <span className="text-xs text-muted-foreground">Total Sales</span>
                  <h4 className="text-xl font-bold mt-1 text-foreground">
                    ৳{Number(data.summary?.totalSales || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-muted-foreground">Cash Received</span>
                  <h4 className="text-xl font-bold mt-1 text-emerald-600">
                    ৳{Number(data.summary?.totalPaid || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-rose-500">
                  <span className="text-xs text-muted-foreground">Customer Due (Credit)</span>
                  <h4 className="text-xl font-bold mt-1 text-rose-600">
                    ৳{Number(data.summary?.totalDue || 0).toLocaleString()}
                  </h4>
                </Card>
                {isAdmin && data.summary?.totalProfit !== undefined && (
                  <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50/20">
                    <span className="text-xs text-muted-foreground">Net Sales Profit (Admin)</span>
                    <h4 className="text-xl font-bold mt-1 text-blue-600">
                      ৳{Number(data.summary?.totalProfit || 0).toLocaleString()}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Margin: {data.summary?.margin}%
                    </span>
                  </Card>
                )}
              </div>

              {/* Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="p-3">Reference #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-center">Payment</th>
                        <th className="p-3 text-right">Total (৳)</th>
                        <th className="p-3 text-right">Cash (৳)</th>
                        <th className="p-3 text-right">Due (৳)</th>
                        {isAdmin && <th className="p-3 text-right">Cost (৳)</th>}
                        {isAdmin && <th className="p-3 text-right">Profit (৳)</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.sales?.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin ? 8 : 6} className="p-8 text-center text-muted-foreground">
                            No sales recorded for this date.
                          </td>
                        </tr>
                      ) : (
                        data.sales?.map((s: any) => (
                          <tr key={s.id} className="hover:bg-muted/20">
                            <td className="p-3 font-mono font-medium">{s.referenceNumber}</td>
                            <td className="p-3">{s.customerName}</td>
                            <td className="p-3 text-center">
                              <Badge variant={s.paymentType === 'CASH' ? 'default' : 'secondary'}>
                                {s.paymentType}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-bold">৳{s.totalAmount.toLocaleString()}</td>
                            <td className="p-3 text-right text-emerald-600 font-medium">
                              ৳{s.paidAmount.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-rose-600 font-bold">
                              ৳{s.dueAmount.toLocaleString()}
                            </td>
                            {isAdmin && (
                              <td className="p-3 text-right text-muted-foreground">
                                ৳{Number(s.totalCost || 0).toLocaleString()}
                              </td>
                            )}
                            {isAdmin && (
                              <td className="p-3 text-right font-bold text-blue-600">
                                ৳{Number(s.profit || 0).toLocaleString()} ({s.profitMargin}%)
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: DUE LIST (AP & AR) */}
          {activeReport === 'due-list' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-muted-foreground">Total Customer Receivables</span>
                  <h4 className="text-xl font-bold mt-1 text-emerald-600">
                    ৳{Number(data.totalCustomerDue || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-rose-500">
                  <span className="text-xs text-muted-foreground">Total Supplier Payables</span>
                  <h4 className="text-xl font-bold mt-1 text-rose-600">
                    ৳{Number(data.totalSupplierDue || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-primary">
                  <span className="text-xs text-muted-foreground">Net Balance</span>
                  <h4
                    className={`text-xl font-bold mt-1 ${
                      Number(data.netBalance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    ৳{Number(data.netBalance || 0).toLocaleString()}
                  </h4>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customers Dues */}
                <Card>
                  <div className="p-3 bg-muted/40 border-b border-border font-semibold text-xs flex items-center justify-between">
                    <span>Customer Debtors (Receivables)</span>
                    <Badge variant="outline">{data.customers?.length || 0} Accounts</Badge>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5 text-right">Current Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.customers?.map((c: any) => (
                          <tr key={c.id}>
                            <td className="p-2.5 font-medium">{c.name}</td>
                            <td className="p-2.5 text-muted-foreground">{c.phone}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">
                              ৳{Number(c.currentDue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Suppliers Dues */}
                <Card>
                  <div className="p-3 bg-muted/40 border-b border-border font-semibold text-xs flex items-center justify-between">
                    <span>Supplier Creditors (Accounts Payable)</span>
                    <Badge variant="outline">{data.suppliers?.length || 0} Accounts</Badge>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-2.5">Supplier</th>
                          <th className="p-2.5">Agency</th>
                          <th className="p-2.5 text-right">Payable Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.suppliers?.map((s: any) => (
                          <tr key={s.id}>
                            <td className="p-2.5 font-medium">{s.name}</td>
                            <td className="p-2.5 text-muted-foreground">{s.companyName || '—'}</td>
                            <td className="p-2.5 text-right font-bold text-rose-600">
                              ৳{Number(s.currentDue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 3: WAREHOUSE STOCK */}
          {activeReport === 'warehouse-stock' && Array.isArray(data) && (
            <div className="space-y-6">
              {data.map((wh: any) => (
                <Card key={wh.warehouseId} className="overflow-hidden">
                  <div className="p-4 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-primary" /> {wh.warehouseName}
                        {wh.isDefault && <Badge variant="secondary">Default</Badge>}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{wh.location || 'Godown location'}</p>
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      Total Quantity in Location: <span className="text-primary font-bold">{wh.totalQuantity} items</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[550px]">
                      <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5">SKU</th>
                          <th className="p-2.5">Company / Brand</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-center">Stock Qty</th>
                          <th className="p-2.5 text-right">Retail Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {wh.stocks?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground">
                              No stock currently mapped to this warehouse.
                            </td>
                          </tr>
                        ) : (
                          wh.stocks?.map((st: any) => (
                            <tr key={st.id}>
                              <td className="p-2.5 font-medium">{st.productName}</td>
                              <td className="p-2.5 font-mono text-muted-foreground">{st.sku}</td>
                              <td className="p-2.5">
                                <Badge variant="outline">{st.company}</Badge>
                              </td>
                              <td className="p-2.5 text-muted-foreground">{st.category}</td>
                              <td className="p-2.5 text-center font-bold text-foreground">
                                {st.quantity} {st.unit}
                              </td>
                              <td className="p-2.5 text-right font-medium">৳{st.sellingPrice.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 4: DAILY PURCHASES */}
          {activeReport === 'daily-purchases' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 border-l-4 border-l-primary">
                  <span className="text-xs text-muted-foreground">Total Inward Stock Cost</span>
                  <h4 className="text-xl font-bold mt-1 text-foreground">
                    ৳{Number(data.summary?.totalPurchasesAmount || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-muted-foreground">Paid Amount</span>
                  <h4 className="text-xl font-bold mt-1 text-emerald-600">
                    ৳{Number(data.summary?.totalPaidAmount || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-rose-500">
                  <span className="text-xs text-muted-foreground">Credit Payable (Supplier Due)</span>
                  <h4 className="text-xl font-bold mt-1 text-rose-600">
                    ৳{Number(data.summary?.totalDueAmount || 0).toLocaleString()}
                  </h4>
                </Card>
              </div>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-center">Payment</th>
                        <th className="p-3 text-right">Total (৳)</th>
                        <th className="p-3 text-right">Paid (৳)</th>
                        <th className="p-3 text-right">Due (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.purchases?.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-3 font-mono font-medium">{p.invoiceNumber}</td>
                          <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="p-3 font-medium">{p.supplierName}</td>
                          <td className="p-3 text-center">
                            <Badge variant={p.paymentType === 'CASH' ? 'default' : 'secondary'}>
                              {p.paymentType}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-bold">৳{p.totalAmount.toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-600">৳{p.paidAmount.toLocaleString()}</td>
                          <td className="p-3 text-right text-rose-600 font-bold">৳{p.dueAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: DAILY COSTS / EXPENSES */}
          {activeReport === 'daily-costs' && (
            <div className="space-y-4">
              <Card className="p-4 border-l-4 border-l-rose-500 max-w-sm">
                <span className="text-xs text-muted-foreground">Total Operational Expenses</span>
                <h4 className="text-2xl font-bold mt-1 text-rose-600">
                  ৳{Number(data.summary?.totalExpenseAmount || 0).toLocaleString()}
                </h4>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Note</th>
                        <th className="p-3 text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.expenses?.map((e: any) => (
                        <tr key={e.id}>
                          <td className="p-3">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="p-3 font-medium">{e.title}</td>
                          <td className="p-3">
                            <Badge variant="secondary">{e.category}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{e.note || '—'}</td>
                          <td className="p-3 text-right font-bold text-rose-600">৳{e.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: PROFIT BY INVOICE (ADMIN ONLY) */}
          {activeReport === 'profit-by-invoice' && isAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-neutral-600">
                  <span className="text-xs text-muted-foreground">Total Invoiced Retail</span>
                  <h4 className="text-xl font-bold mt-1 text-foreground">
                    ৳{Number(data.totalSelling || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-neutral-400">
                  <span className="text-xs text-muted-foreground">Total Invoiced Cost (COGS)</span>
                  <h4 className="text-xl font-bold mt-1 text-muted-foreground">
                    ৳{Number(data.totalCost || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-muted-foreground">Net Invoice Profit</span>
                  <h4 className="text-xl font-bold mt-1 text-emerald-600">
                    ৳{Number(data.netProfit || 0).toLocaleString()}
                  </h4>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <span className="text-xs text-muted-foreground">Overall Margin</span>
                  <h4 className="text-xl font-bold mt-1 text-blue-600">{data.overallMargin}%</h4>
                </Card>
              </div>

              <Card>
                <div className="p-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">Invoice: {data.invoiceNumber}</span>
                    <span className="text-muted-foreground ml-2">Customer: {data.customerName}</span>
                  </div>
                  <Badge variant="outline">{new Date(data.date).toLocaleDateString()}</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase font-semibold">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Cost (৳)</th>
                        <th className="p-3 text-right">Selling Rate (৳)</th>
                        <th className="p-3 text-right">Line Profit (৳)</th>
                        <th className="p-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium">{item.productName}</td>
                          <td className="p-3 font-mono text-muted-foreground">{item.sku}</td>
                          <td className="p-3 text-center font-bold">{item.quantity}</td>
                          <td className="p-3 text-right">৳{item.unitCost.toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold">৳{item.unitPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            ৳{item.lineProfit.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-semibold text-blue-600">
                            {item.profitMargin}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 7: BALANCE SHEET (ADMIN ONLY) */}
          {activeReport === 'balance-sheet' && isAdmin && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <Card className="p-6">
                <div className="border-b border-border pb-4 mb-6 text-center">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-foreground">
                    M.R. Enterprise — Executive Financial Statement
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Operating Performance, Trading Account & Current Working Capital Balance
                  </p>
                </div>

                <div className="space-y-6 text-xs">
                  {/* Trading & Operating Performance */}
                  <div>
                    <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-3 text-primary">
                      1. Trading & Operating Income
                    </h4>
                    <div className="space-y-2 divide-y divide-border">
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Gross Sales Revenue (Approved Invoices):</span>
                        <span className="text-foreground font-bold">
                          ৳{Number(data.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Cost of Goods Sold (COGS at Purchase DP Rate):</span>
                        <span className="text-muted-foreground">
                          (৳{Number(data.cogs || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-emerald-600 bg-emerald-50/30 px-2 rounded">
                        <span>Gross Operating Trading Profit:</span>
                        <span>৳{Number(data.grossProfit || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Operating Costs & Daily Expenses (Rent, Bills, Salaries):</span>
                        <span className="text-rose-600 font-semibold">
                          (৳{Number(data.operatingExpenses || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm font-black text-foreground bg-muted p-2 rounded">
                        <span>Net Operating Income (Retained Profit):</span>
                        <span
                          className={
                            Number(data.netOperatingIncome || 0) >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          ৳{Number(data.netOperatingIncome || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Assets & Liabilities */}
                  <div>
                    <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-3 text-primary">
                      2. Current Assets & Working Capital
                    </h4>
                    <div className="space-y-2 divide-y divide-border">
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Accounts Receivable (Customer Dues Owed to Us):</span>
                        <span className="text-emerald-600 font-bold">
                          ৳{Number(data.accountsReceivable || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Current Inventory Valuation (Stock at Cost Price):</span>
                        <span className="text-foreground font-bold">
                          ৳{Number(data.inventoryValuation || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 font-medium">
                        <span>Accounts Payable (Supplier Credit Dues Owed by Us):</span>
                        <span className="text-rose-600 font-bold">
                          (৳{Number(data.accountsPayable || 0).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm font-black text-foreground bg-primary/10 p-2 rounded">
                        <span>Net Working Capital Position:</span>
                        <span className="text-primary font-bold">
                          ৳{Number(data.netWorkingCapital || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Fallback for raw array reports like catalog inventory, adjustments, cash handover */}
          {Array.isArray(data) && activeReport !== 'warehouse-stock' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold">
                    <tr>
                      {data.length > 0 &&
                        Object.keys(data[0])
                          .filter((k) => k !== 'id')
                          .slice(0, 7)
                          .map((key) => (
                            <th key={key} className="p-3 capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        {Object.keys(row)
                          .filter((k) => k !== 'id')
                          .slice(0, 7)
                          .map((key) => (
                            <td key={key} className="p-3">
                              {typeof row[key] === 'boolean'
                                ? row[key]
                                  ? 'Yes'
                                  : 'No'
                                : typeof row[key] === 'number'
                                ? row[key].toLocaleString()
                                : String(row[key] || '—')}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
