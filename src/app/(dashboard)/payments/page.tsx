'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { PartyPayment } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { EditCollectionPaidModal } from '@/components/payments/edit-collection-paid-modal';
import { BadgeDollarSign, ArrowDownLeft, ArrowUpRight, Search, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';

export default function PaymentsPage() {
  const { user } = useAuth();
  const { t, formatMoney } = useLanguage();
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [payments, setPayments] = useState<PartyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Infinite Scroll
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, totalAmount: 0 });
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER_COLLECTION' | 'SUPPLIER_PAYMENT'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Selection
  const [selectedPayment, setSelectedPayment] = useState<PartyPayment | null>(null);

  // Edit Collection OR Paid Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [modalInitialTxId, setModalInitialTxId] = useState<string | undefined>(undefined);

  const fetchPayments = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await api.get<PartyPayment[]>('/payments', {
        page,
        limit,
        type: activeTab !== 'ALL' ? activeTab : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (page === 1) {
        setPayments(res.data);
      } else {
        setPayments((prev) => [...prev, ...res.data]);
      }

      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          totalAmount: (res.meta as any).totalAmount || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, limit, activeTab, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, startDate, endDate]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !loadingMore && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const handleOpenNewCollection = () => {
    setModalType('SALES');
    setModalInitialTxId(undefined);
    setModalOpen(true);
  };

  const handleOpenNewPayment = () => {
    setModalType('PURCHASE');
    setModalInitialTxId(undefined);
    setModalOpen(true);
  };

  const handleViewPayment = (p: PartyPayment) => {
    setModalType(p.type === 'CUSTOMER_COLLECTION' ? 'SALES' : 'PURCHASE');
    setModalInitialTxId(p.receiptNumber);
    setModalOpen(true);
  };

  const totalCollections = activeTab !== 'SUPPLIER_PAYMENT' 
    ? payments.filter((p) => p.type === 'CUSTOMER_COLLECTION').reduce((acc, p) => acc + Number(p.amount), 0)
    : 0;

  const totalPayouts = activeTab !== 'CUSTOMER_COLLECTION'
    ? payments.filter((p) => p.type === 'SUPPLIER_PAYMENT').reduce((acc, p) => acc + Number(p.amount), 0)
    : 0;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <BadgeDollarSign className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">{t('payments.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNewCollection}
              className="px-2.5 py-1 text-xs font-bold bg-white text-emerald-700 border border-emerald-800 shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-emerald-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('payments.collections')}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenNewPayment}
              className="px-2.5 py-1 text-xs font-bold bg-white text-rose-700 border border-rose-800 shadow-xs flex items-center gap-1.5 rounded-xs hover:bg-rose-50 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              <span>{t('payments.payouts')}</span>
            </button>
          </div>
        </div>

        {/* Gray Filter Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-3 items-center justify-between text-sm">
          {/* Tabs */}
          <div className="flex bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs overflow-hidden">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'ALL' ? 'bg-[#0056b3] text-white' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveTab('CUSTOMER_COLLECTION')}
              className={`px-3 py-1 text-xs font-bold border-l border-neutral-400 dark:border-slate-600 transition-colors ${
                activeTab === 'CUSTOMER_COLLECTION' ? 'bg-[#0056b3] text-white' : 'text-emerald-700 dark:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
            >
              COLLECTIONS
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIER_PAYMENT')}
              className={`px-3 py-1 text-xs font-bold border-l border-neutral-400 dark:border-slate-600 transition-colors ${
                activeTab === 'SUPPLIER_PAYMENT' ? 'bg-[#0056b3] text-white' : 'text-rose-700 dark:text-rose-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
              }`}
            >
              PAYOUTS
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider">{t('common.date')}:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <span className="text-neutral-500 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-7 px-1.5 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="h-7 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm ml-1"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div 
          className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-950 relative custom-scrollbar"
          onScroll={handleTableScroll}
        >
          <table className="w-full text-xs text-left min-w-[800px] border-collapse relative">
            <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <tr>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">SN</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28">Receipt #</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24">Date</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36">Type</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[180px]">Party (Customer / Supplier)</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">Method</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[160px]">Ref Note</th>
                <th className="px-3 py-1.5 w-28 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {loading && page === 1 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Loading cash flow...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-600 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BadgeDollarSign className="w-8 h-8 text-neutral-400" />
                      <span>No payment or collection records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {payments.map((p, idx) => {
                    const isSelected = selectedPayment?.id === p.id;
                    const isCollection = p.type === 'CUSTOMER_COLLECTION';
                    
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setSelectedPayment(p)}
                        onDoubleClick={() => handleViewPayment(p)}
                        title="Double-click to view/edit details"
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono font-bold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{p.receiptNumber}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>{formatDate(p.createdAt)}</td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            isCollection
                              ? isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : isSelected ? 'bg-rose-600 text-white border-rose-500' : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}>
                            {isCollection ? 'COLLECTION' : 'PAYOUT'}
                          </span>
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          <div className="flex flex-col">
                            <span className={`font-semibold ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>
                              {isCollection ? p.customer?.name || 'Customer' : p.supplier?.name || 'Supplier'}
                            </span>
                            <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>
                              {isCollection ? p.customer?.phone : p.supplier?.phone}
                            </span>
                          </div>
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono font-bold ${isSelected ? 'text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {p.paymentMethod}
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 truncate max-w-[200px] ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>
                          {p.referenceNote || '--'}
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold ${
                          isCollection 
                            ? isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                            : isSelected ? 'text-white' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {isCollection ? '+' : '-'}৳ {Number(p.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {loadingMore && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Loading more...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Status / Summary Bar */}
        <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-blue-900 dark:text-blue-300">
              Loaded <strong>{payments.length}</strong> total of <strong>{meta.total}</strong>
            </span>
            <span>•</span>
            <span className="text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
              Collections: <strong className="text-emerald-700 dark:text-emerald-400">৳ {totalCollections.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span className="text-rose-900 dark:text-rose-300 flex items-center gap-1">
              Payouts: <strong className="text-rose-700 dark:text-rose-400">৳ {totalPayouts.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
            {selectedPayment ? (
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedPayment.receiptNumber}
              </span>
            ) : (
              <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                Tip: Double-click a row to view/edit details
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Collection OR Paid Modal */}
      <EditCollectionPaidModal
        open={modalOpen}
        onOpenChange={(isOpen) => {
          setModalOpen(isOpen);
          if (!isOpen) {
            setModalInitialTxId(undefined); // clear it when closed
          }
        }}
        initialType={modalType}
        initialTransactionId={modalInitialTxId}
        onSuccess={() => {
          if (page === 1) fetchPayments();
          else setPage(1);
        }}
      />
    </div>
  );
}
