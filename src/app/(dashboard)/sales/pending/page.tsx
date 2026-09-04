'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';

export default function PendingSalesQueuePage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval Dialog
  const [approvingSale, setApprovingSale] = useState<Sale | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Rejection Dialog
  const [rejectingSale, setRejectingSale] = useState<Sale | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // View Details Dialog
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const fetchPendingSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Sale[]>('/sales', { status: 'PENDING' });
      setSales(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending sales queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSales();
  }, []);

  const handleApprove = async () => {
    if (!approvingSale) return;
    setIsApproving(true);
    try {
      await api.post(`/sales/${approvingSale.id}/approve`);
      setApprovingSale(null);
      await fetchPendingSales();
    } catch (err: any) {
      alert(err.message || 'Failed to approve sale.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingSale || !rejectionReason.trim()) return;
    setIsRejecting(true);
    try {
      await api.post(`/sales/${rejectingSale.id}/reject`, { reason: rejectionReason });
      setRejectingSale(null);
      setRejectionReason('');
      await fetchPendingSales();
    } catch (err: any) {
      alert(err.message || 'Failed to reject sale.');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" /> Pending Sales Review Queue
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review pending sales submitted by Sales Officers, confirm physical cash handover, and execute stock deduction
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading pending sales...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No sales currently pending review. All orders are processed!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">Reference #</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Sales Officer</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items Summary</th>
                    <th className="p-3 text-right">Total Cash Required</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/40">
                      <td className="p-3 font-mono font-medium text-foreground">
                        {sale.referenceNumber}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                      <td className="p-3 font-medium text-foreground">{sale.salesOfficer?.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {sale.customerName || 'Walk-in'}
                        {sale.customerPhone && (
                          <span className="text-[10px] block">{sale.customerPhone}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setViewingSale(sale)}
                          className="text-primary hover:underline font-medium"
                        >
                          {sale.items?.length || 0} product line(s) (view)
                        </button>
                      </td>
                      <td className="p-3 text-right font-bold text-foreground text-sm font-mono">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold"
                          onClick={() => setApprovingSale(sale)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Handover & Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => setRejectingSale(sale)}
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

      {/* Approve Modal */}
      <Dialog
        open={!!approvingSale}
        onOpenChange={(open) => !open && setApprovingSale(null)}
      >
        <DialogHeader>
          <DialogTitle>Confirm Cash Handover & Approve Sale</DialogTitle>
          <DialogDescription>
            Reference: <strong>{approvingSale?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {approvingSale && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 font-mono">
              <div className="flex justify-between font-sans">
                <span className="text-muted-foreground">Responsible Sales Officer:</span>
                <span className="font-semibold text-foreground">{approvingSale.salesOfficer?.name}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground font-sans">Cash Handover Amount:</span>
                <span className="font-bold text-base text-foreground">
                  {formatCurrency(approvingSale.totalAmount)}
                </span>
              </div>
            </div>

            <div className="border rounded-lg p-2.5 max-h-40 overflow-y-auto">
              <p className="font-semibold text-foreground mb-1">Products to be deducted from stock:</p>
              <ul className="divide-y text-[11px]">
                {approvingSale.items?.map((item) => (
                  <li key={item.id} className="py-1 flex justify-between">
                    <span>
                      {item.product?.name} ({item.product?.sku})
                    </span>
                    <strong className="text-destructive font-mono">-{item.quantity} {item.product?.unit || 'units'}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
              ⚠️ <strong>Transaction Notice:</strong> Double approval is automatically prevented by database isolation. Inventory will only deduct once upon successful handover confirmation.
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingSale(null)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? 'Approving...' : 'Confirm Cash Received & Approve'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Reject Modal */}
      <Dialog
        open={!!rejectingSale}
        onOpenChange={(open) => !open && setRejectingSale(null)}
      >
        <DialogHeader>
          <DialogTitle>Reject Sale Entry</DialogTitle>
          <DialogDescription>
            Reference: <strong>{rejectingSale?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            Rejecting this sale keeps the record for audit history but will not deduct any inventory.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Reason for Rejection *</label>
            <Input
              placeholder="e.g. Customer cancelled, cash not received, incorrect item entered"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingSale(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogHeader>
          <DialogTitle>Sale Breakdown</DialogTitle>
          <DialogDescription>
            Reference: <strong className="font-mono text-foreground">{viewingSale?.referenceNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        {viewingSale && (
          <div className="space-y-3 text-xs">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left font-semibold text-muted-foreground">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewingSale.items?.map((item) => (
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
                      <td className="p-2 text-right font-bold text-foreground">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewingSale.note && (
              <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded">
                <strong>Note:</strong> {viewingSale.note}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setViewingSale(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}

