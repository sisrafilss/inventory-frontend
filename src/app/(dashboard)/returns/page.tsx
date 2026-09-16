'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  RotateCcw,
  Undo2,
  Plus,
  Search,
  Loader2,
  Eye,
  Printer,
  AlertCircle,
  FileText,
  Building2,
  Warehouse,
} from 'lucide-react';
import { CreateSalesReturnModal } from '@/components/returns/create-sales-return-modal';
import { CreatePurchaseReturnModal } from '@/components/returns/create-purchase-return-modal';
import { ViewReturnModal } from '@/components/returns/view-return-modal';

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesReturns, setSalesReturns] = useState<any[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Modals
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  useEffect(() => {
    fetchReturns();
  }, [activeTab]);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'sales') {
        const res = await api.get<any>('/returns/sales', { search: search || undefined });
        setSalesReturns(res.data || []);
      } else {
        const res = await api.get<any>('/returns/purchases', { search: search || undefined });
        setPurchaseReturns(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch return records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns();
  };

  // Stats calculations
  const totalSalesReturnVal = salesReturns.reduce(
    (acc, r) => acc + (Number(r.refundAmount) || 0),
    0
  );
  const totalPurchaseReturnVal = purchaseReturns.reduce(
    (acc, r) => acc + (Number(r.refundAmount) || 0),
    0
  );

  const currentList = activeTab === 'sales' ? salesReturns : purchaseReturns;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-white" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Returns & Refunds
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSalesReturnModalOpen(true)}
              className="h-7 px-3 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 font-bold text-xs rounded-xs flex items-center gap-1 shadow-sm transition-colors border border-neutral-400 cursor-pointer"
            >
              + New Sales Return (Customer)
            </button>
            <button
              type="button"
              onClick={() => setIsPurchaseReturnModalOpen(true)}
              className="h-7 px-3 bg-[#800000] text-white hover:bg-red-900 font-bold text-xs rounded-xs flex items-center gap-1 shadow-sm transition-colors border border-red-950 cursor-pointer"
            >
              + New Purchase Return (Supplier)
            </button>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800 border-b border-neutral-400 dark:border-slate-700 py-2 px-3 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Tab Switches */}
            <div className="flex items-center border border-neutral-400 dark:border-slate-600 rounded-xs overflow-hidden p-0.5 bg-neutral-200 dark:bg-slate-900 mr-2">
              <button
                type="button"
                onClick={() => { setActiveTab('sales'); setSelectedRowId(null); }}
                className={`h-6 px-2.5 font-bold text-xs rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-[#006400] text-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCcw className="w-3 h-3" /> Sales Returns
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('purchase'); setSelectedRowId(null); }}
                className={`h-6 px-2.5 font-bold text-xs rounded-xs transition-colors flex items-center gap-1 cursor-pointer ${
                  activeTab === 'purchase'
                    ? 'bg-[#800000] text-white shadow-xs'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-slate-800'
                }`}
              >
                <Undo2 className="w-3 h-3" /> Purchase Returns
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 max-w-sm relative">
                <input
                  type="text"
                  placeholder="Search by return #, customer, supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1.5" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-6 px-2.5 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </form>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex items-center gap-3 text-xs font-mono font-bold">
            <span className="text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              Sales Refunds: <strong>৳{totalSalesReturnVal.toFixed(2)}</strong>
            </span>
            <span className="text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
              Purchase Returns: <strong>৳{totalPurchaseReturnVal.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Desktop Spreadsheet Data Grid */}
        <div className="flex-1 min-h-[300px] flex flex-col border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                <tr>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36">Return #</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36">Date</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36">Created By</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[160px]">
                    {activeTab === 'sales' ? 'Customer' : 'Supplier'}
                  </th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">Warehouse</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">Items</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-right">Refund Amount</th>
                  <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">Refund Method</th>
                  <th className="px-3 py-1.5 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-neutral-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                        <span>Loading return records...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-rose-600 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-neutral-500 font-medium">
                      No {activeTab === 'sales' ? 'Sales Return' : 'Purchase Return'} records found.
                    </td>
                  </tr>
                ) : (
                  currentList.map((item, idx) => {
                    const isSelected = selectedRowId === item.id;
                    const partyName = activeTab === 'sales'
                      ? item.customer?.name || 'Walk-in Customer'
                      : item.supplier?.name || 'General Supplier';

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRowId(item.id)}
                        className={`transition-colors cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-[#006400] text-white font-medium'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-neutral-100 hover:bg-[#e6f2e6] dark:hover:bg-slate-800'
                            : 'bg-[#f4f8fc] dark:bg-slate-850 text-neutral-900 dark:text-neutral-100 hover:bg-[#e6f2e6] dark:hover:bg-slate-800'
                        }`}
                      >
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 text-center font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 font-mono font-bold">
                          {item.returnNumber}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 text-[11px]">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5">
                          {item.createdBy?.name || 'System'}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 font-semibold">
                          {partyName}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5">
                          {item.warehouse?.name || '-'}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 text-center font-bold">
                          {item.items?.length || 0}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 text-right font-extrabold">
                          ৳{Number(item.refundAmount || item.totalAmount).toFixed(2)}
                        </td>
                        <td className="border-r border-neutral-200 dark:border-slate-800 px-3 py-1.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold border uppercase ${
                              isSelected
                                ? 'bg-white text-emerald-900 border-white'
                                : item.refundType === 'CREDIT_ADJUSTMENT'
                                ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                            }`}
                          >
                            {item.refundType === 'CREDIT_ADJUSTMENT' ? 'Due Credit' : 'Cash Refund'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReturn({ data: item, type: activeTab });
                            }}
                            className={`h-6 px-2 rounded-xs font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-white text-neutral-900 border-white hover:bg-neutral-100'
                                : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-400 hover:bg-neutral-100'
                            }`}
                          >
                            <Printer className="w-3 h-3 text-emerald-700" /> Voucher
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Status Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-emerald-900 dark:text-emerald-300">
                Loaded <strong>{currentList.length}</strong> records
              </span>
              <span>•</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                Page: <strong>1 / 1</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              <span>Tip: Click 'Voucher' to view itemized printable receipt</span>
            </div>
          </div>
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

      {/* View Return Detail Voucher Modal */}
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
