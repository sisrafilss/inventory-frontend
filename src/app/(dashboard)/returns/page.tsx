'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  RotateCcw,
  Undo2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { CreateSalesReturnModal } from '@/components/returns/create-sales-return-modal';
import { CreatePurchaseReturnModal } from '@/components/returns/create-purchase-return-modal';
import { ViewReturnModal } from '@/components/returns/view-return-modal';

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [loading, setLoading] = useState(false);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const res = await api.get<any>('/returns/sales', { search });
        setSalesReturns(res.data || []);
      } else {
        const res = await api.get<any>('/returns/purchases', { search });
        setPurchaseReturns(res.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch return records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns();
  };

  // Calculations for stats
  const totalSalesReturnVal = salesReturns.reduce(
    (acc, r) => acc + (Number(r.refundAmount) || 0),
    0
  );
  const totalPurchaseReturnVal = purchaseReturns.reduce(
    (acc, r) => acc + (Number(r.refundAmount) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Returns & Refunds Management (রিটার্ন ও রিফান্ড ব্যবস্থাপনা)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer sales returns, supplier purchase returns, stock adjustments and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSalesReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#006400] hover:bg-[#004d00] rounded shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Sales Return (Customer)
          </button>
          <button
            onClick={() => setIsPurchaseReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Purchase Return (Supplier)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sales Returns Count
            </p>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {salesReturns.length} <span className="text-xs font-normal text-slate-400">Records</span>
            </h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Customer Refunds Total
            </p>
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              ৳{totalSalesReturnVal.toFixed(2)}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Purchase Returns Count
            </p>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {purchaseReturns.length} <span className="text-xs font-normal text-slate-400">Records</span>
            </h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Undo2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Supplier Returns Value
            </p>
            <h3 className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
              ৳{totalPurchaseReturnVal.toFixed(2)}
            </h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs overflow-hidden">
        {/* Tabs & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === 'sales'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sales Returns (Customer)
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                activeTab === 'purchase'
                  ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Purchase Returns (Supplier)
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search return # or party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md w-48 sm:w-60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={fetchReturns}
              className="p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 text-slate-600 dark:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading returns list...</div>
          ) : activeTab === 'sales' ? (
            salesReturns.length === 0 ? (
              <div className="p-12 text-center">
                <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No Sales Return records found.</p>
                <button
                  onClick={() => setIsSalesReturnModalOpen(true)}
                  className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  + Create first Sales Return
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Return #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Warehouse</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3 text-right">Refund Amount</th>
                    <th className="p-3 text-center">Refund Method</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {salesReturns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {item.returnNumber}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-semibold">
                        {item.customer?.name || <span className="text-slate-400 italic">Walk-in</span>}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {item.warehouse?.name || '-'}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {item.items?.length || 0}
                      </td>
                      <td className="p-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">
                        ৳{Number(item.refundAmount || item.totalAmount).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          item.refundType === 'CREDIT_ADJUSTMENT'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {item.refundType === 'CREDIT_ADJUSTMENT' ? 'Due Credit' : 'Cash'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedReturn({ data: item, type: 'sales' })}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Voucher
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : purchaseReturns.length === 0 ? (
            <div className="p-12 text-center">
              <Undo2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No Purchase Return records found.</p>
              <button
                onClick={() => setIsPurchaseReturnModalOpen(true)}
                className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                + Create first Purchase Return
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Return #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-right">Refund Value</th>
                  <th className="p-3 text-center">Refund Method</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {purchaseReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {item.returnNumber}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold">
                      {item.supplier?.name || <span className="text-slate-400 italic">General</span>}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {item.warehouse?.name || '-'}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {item.items?.length || 0}
                    </td>
                    <td className="p-3 text-right font-extrabold text-amber-700 dark:text-amber-400">
                      ৳{Number(item.refundAmount || item.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        item.refundType === 'CREDIT_ADJUSTMENT'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {item.refundType === 'CREDIT_ADJUSTMENT' ? 'Due Credit' : 'Cash'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReturn({ data: item, type: 'purchase' })}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Sales Return Modal */}
      <CreateSalesReturnModal
        isOpen={isSalesReturnModalOpen}
        onClose={() => setIsSalesReturnModalOpen(false)}
        onSuccess={fetchReturns}
      />

      {/* Create Purchase Return Modal */}
      <CreatePurchaseReturnModal
        isOpen={isPurchaseReturnModalOpen}
        onClose={() => setIsPurchaseReturnModalOpen(false)}
        onSuccess={fetchReturns}
      />

      {/* View Return Detail Modal */}
      {selectedReturn && (
        <ViewReturnModal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          data={selectedReturn.data}
          type={selectedReturn.type}
        />
      )}
    </div>
  );
}
