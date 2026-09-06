'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Package,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t('dashboard.welcomeBack')}, {user?.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.overviewSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sales/new">
            <Button size="sm" className="gap-1.5 text-xs shadow-sm font-semibold">
              <PlusCircle className="w-4 h-4" /> {t('dashboard.quickNewSale')}
            </Button>
          </Link>
          <Button onClick={fetchDashboard} size="sm" variant="outline" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.todaySalesValue')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">
              {formatMoney(data.stats.todaySalesAmount)}
            </h4>
            <span className="text-[10px] text-muted-foreground">
              {data.stats.todaySalesCount} {t('sales.lines') || 'orders'}
            </span>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.monthSalesTotal')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">
              {formatMoney(data.stats.monthSalesAmount)}
            </h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.totalStockQuantity')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">{data.stats.inventoryQuantity}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.activeProducts')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">{data.stats.productsCount}</h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.estCostValuation')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">
              {formatMoney(data.stats.inventoryCostValue)}
            </h4>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{t('dashboard.lowOutOfStock')}</p>
            <h4 className="text-xl font-bold text-foreground font-mono">
              {data.stats.lowStockCount + data.stats.outOfStockCount}
            </h4>
          </div>
        </Card>
      </div>

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
              <table className="w-full text-xs min-w-[500px]">
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
                          variant={sale.status === 'COMPLETED' ? 'success' : 'destructive'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {sale.status === 'COMPLETED'
                            ? t('statuses.completed') || 'Completed'
                            : t('statuses.cancelled') || 'Cancelled'}
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
    </div>
  );
}
