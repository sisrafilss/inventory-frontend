'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Supplier, Customer } from '@/lib/types';
import {
  Users,
  Truck,
  Calendar as CalendarIcon,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';
import { SupplierModal } from '@/components/parties/supplier-modal';
import { CustomerModal } from '@/components/parties/customer-modal';
import { PartyPaymentModal } from '@/components/parties/party-payment-modal';

export default function PartiesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Current Date Display (DD-MM-YYYY)
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Master Data State
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'DUE'>('ALL');

  // Selected row in table
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  // Status Banner Notification
  const [statusBanner, setStatusBanner] = useState<{ text: string; isError: boolean } | null>(null);

  // Modals State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [modalSupplier, setModalSupplier] = useState<Supplier | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [modalCustomer, setModalCustomer] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<'PAY' | 'COLLECT'>('PAY');
  const [paymentTargetParty, setPaymentTargetParty] = useState<{
    id: string;
    name: string;
    phone?: string | null;
    due: number;
  } | null>(null);

  // Fetch Data
  const fetchSuppliers = async () => {
    try {
      const res = await api.get<Supplier[]>('/parties/suppliers');
      setSuppliers(res.data);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
      throw err;
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get<Customer[]>('/parties/customers');
      setCustomers(res.data);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      throw err;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchSuppliers(), fetchCustomers()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Summary Metrics
  const totalSupplierDue = useMemo(
    () => suppliers.reduce((acc, s) => acc + (Number(s.currentDue) || 0), 0),
    [suppliers]
  );
  const totalCustomerDue = useMemo(
    () => customers.reduce((acc, c) => acc + (Number(c.currentDue) || 0), 0),
    [customers]
  );
  const netBalance = totalCustomerDue - totalSupplierDue;

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;
      if (statusFilter === 'DUE' && (Number(s.currentDue) || 0) <= 0) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchCode = s.code ? s.code.toLowerCase().includes(q) : false;
      const matchName = s.name.toLowerCase().includes(q);
      const matchCompany = s.companyName ? s.companyName.toLowerCase().includes(q) : false;
      const matchPhone = s.phone ? s.phone.toLowerCase().includes(q) : false;
      const matchAddress = s.address ? s.address.toLowerCase().includes(q) : false;
      const matchId = s.id.toLowerCase().includes(q);

      return matchCode || matchName || matchCompany || matchPhone || matchAddress || matchId;
    });
  }, [suppliers, statusFilter, search]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter === 'ACTIVE' && !c.isActive) return false;
      if (statusFilter === 'INACTIVE' && c.isActive) return false;
      if (statusFilter === 'DUE' && (Number(c.currentDue) || 0) <= 0) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchCode = c.code ? c.code.toLowerCase().includes(q) : false;
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone ? c.phone.toLowerCase().includes(q) : false;
      const matchAddress = c.address ? c.address.toLowerCase().includes(q) : false;
      const matchId = c.id.toLowerCase().includes(q);

      return matchCode || matchName || matchPhone || matchAddress || matchId;
    });
  }, [customers, statusFilter, search]);

  // Currently Selected Objects
  const selectedSupplier = useMemo(
    () => (activeTab === 'suppliers' ? suppliers.find((s) => s.id === selectedPartyId) || null : null),
    [activeTab, suppliers, selectedPartyId]
  );

  const selectedCustomer = useMemo(
    () => (activeTab === 'customers' ? customers.find((c) => c.id === selectedPartyId) || null : null),
    [activeTab, customers, selectedPartyId]
  );

  // Handlers for Supplier
  const handleOpenCreateSupplier = () => {
    setModalSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setSelectedPartyId(s.id);
    setModalSupplier(s);
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete supplier "${s.name}"?\n\nIf this vendor has purchase invoices or transaction records, deletion will be blocked.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/parties/suppliers/${s.id}`);
      setStatusBanner({
        text: `Supplier "${s.name}" was successfully deleted.`,
        isError: false,
      });
      if (selectedPartyId === s.id) setSelectedPartyId(null);
      await fetchSuppliers();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete supplier.',
        isError: true,
      });
    }
  };

  // Handlers for Customer
  const handleOpenCreateCustomer = () => {
    setModalCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setSelectedPartyId(c.id);
    setModalCustomer(c);
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = async (c: Customer) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete customer "${c.name}"?\n\nIf this customer has sales invoices or transaction history, deletion will be blocked.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/parties/customers/${c.id}`);
      setStatusBanner({
        text: `Customer "${c.name}" was successfully deleted.`,
        isError: false,
      });
      if (selectedPartyId === c.id) setSelectedPartyId(null);
      await fetchCustomers();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete customer.',
        isError: true,
      });
    }
  };

  // Quick Payment / Collection Handlers
  const handleOpenPaySupplier = (s: Supplier) => {
    setPaymentModalType('PAY');
    setPaymentTargetParty({
      id: s.id,
      name: s.name,
      phone: s.phone,
      due: Number(s.currentDue) || 0,
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenCollectCustomer = (c: Customer) => {
    setPaymentModalType('COLLECT');
    setPaymentTargetParty({
      id: c.id,
      name: c.name,
      phone: c.phone,
      due: Number(c.currentDue) || 0,
    });
    setIsPaymentModalOpen(true);
  };

  // Current active counts
  const currentListCount = activeTab === 'suppliers' ? suppliers.length : customers.length;
  const currentActiveCount =
    activeTab === 'suppliers'
      ? suppliers.filter((s) => s.isActive).length
      : customers.filter((c) => c.isActive).length;
  const currentInactiveCount =
    activeTab === 'suppliers'
      ? suppliers.filter((s) => !s.isActive).length
      : customers.filter((c) => !c.isActive).length;
  const currentDueCount =
    activeTab === 'suppliers'
      ? suppliers.filter((s) => Number(s.currentDue) > 0).length
      : customers.filter((c) => Number(c.currentDue) > 0).length;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      {/* Desktop Main Window Frame */}
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              Suppliers & Customers Management
              <span className="text-[11px] font-mono font-normal text-emerald-200 uppercase tracking-widest hidden sm:inline border border-emerald-500/40 px-1.5 py-0.5 rounded-xs bg-emerald-900/30">
                [ACCOUNTS PAYABLE & RECEIVABLE / DIRECTORY]
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Date Box */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#004d00]/60 border border-emerald-600/40 px-2 py-0.5 rounded-xs text-[11px] font-mono text-emerald-100 shadow-inner">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Date {currentDate}</span>
            </div>

            {/* Add Supplier Button */}
            <button
              type="button"
              onClick={handleOpenCreateSupplier}
              className={`px-3 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs border ${
                activeTab === 'suppliers'
                  ? 'bg-white text-[#006400] hover:bg-emerald-50 border-white'
                  : 'bg-[#004d00] text-white hover:bg-emerald-800 border-emerald-500/50'
              }`}
              title="Add a new supplier / vendor"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <Truck className="w-3.5 h-3.5" />
              <span>Add Supplier</span>
            </button>

            {/* Add Customer Button */}
            <button
              type="button"
              onClick={handleOpenCreateCustomer}
              className={`px-3 py-1 text-xs font-bold rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs border ${
                activeTab === 'customers'
                  ? 'bg-white text-[#006400] hover:bg-emerald-50 border-white'
                  : 'bg-[#004d00] text-white hover:bg-emerald-800 border-emerald-500/50'
              }`}
              title="Add a new customer account"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <Users className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        {/* Master Content Section: Expanded Table Area */}
        <div className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 space-y-2 text-xs text-neutral-900 dark:text-neutral-100">
          {/* Status / Error Banner */}
          {statusBanner && (
            <div
              className={`p-2 rounded-xs border text-xs flex items-center justify-between shadow-xs shrink-0 ${
                statusBanner.isError
                  ? 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusBanner.isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="font-semibold">{statusBanner.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 ml-2 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Compact Accounting Financial KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 shrink-0">
            {/* Supplier Payables */}
            <div className="bg-[#dbe7f3] dark:bg-slate-800/80 px-3 py-1.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    Supplier Payables (We Owe)
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-700 dark:text-rose-400">
                    ৳{totalSupplierDue.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-neutral-400">
                {suppliers.filter((s) => Number(s.currentDue) > 0).length} Due
              </span>
            </div>

            {/* Customer Receivables */}
            <div className="bg-[#dbe7f3] dark:bg-slate-800/80 px-3 py-1.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    Customer Receivables (Owed)
                  </div>
                  <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    ৳{totalCustomerDue.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-neutral-400">
                {customers.filter((c) => Number(c.currentDue) > 0).length} Due
              </span>
            </div>

            {/* Net Financial Balance */}
            <div className="bg-[#dbe7f3] dark:bg-slate-800/80 px-3 py-1.5 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    Net Receivable / Payable
                  </div>
                  <div
                    className={`font-mono text-sm font-bold ${
                      netBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    ৳{netBalance.toLocaleString()}
                  </div>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                  netBalance >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}
              >
                {netBalance >= 0 ? '+ Receivable' : '- Payable'}
              </span>
            </div>
          </div>

          {/* Search & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-[#dbe7f3] dark:bg-slate-800/60 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner shrink-0">
            {/* Search Input & Tab Switcher */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Tab Selector Buttons */}
              <div className="flex items-center border border-neutral-400 dark:border-slate-600 rounded-xs overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('suppliers');
                    setSelectedPartyId(null);
                  }}
                  className={`px-3 py-1 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'suppliers'
                      ? 'bg-[#006400] text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Suppliers ({suppliers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customers');
                    setSelectedPartyId(null);
                  }}
                  className={`px-3 py-1 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'customers'
                      ? 'bg-[#006400] text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Customers ({customers.length})</span>
                </button>
              </div>

              {/* Search Filter Input */}
              <div className="relative flex-1 sm:w-72">
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'suppliers' ? 'suppliers' : 'customers'} by code, name, phone...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1.5" />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-200 underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Status Filters & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mr-1">
                  Status:
                </span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-[#004d00] text-white border-[#004d00]'
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                  }`}
                >
                  All ({currentListCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                  }`}
                >
                  Active ({currentActiveCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                  }`}
                >
                  Inactive ({currentInactiveCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('DUE')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-xs border transition-colors cursor-pointer ${
                    statusFilter === 'DUE'
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-400 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                  }`}
                >
                  With Due ({currentDueCount})
                </button>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-300 dark:border-slate-700">
                {activeTab === 'suppliers' && selectedSupplier && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenPaySupplier(selectedSupplier)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-500 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Pay due balance to this vendor"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Pay Due</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSupplier(selectedSupplier)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Edit supplier details"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSupplier(selectedSupplier)}
                        className="h-6 px-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-500 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Delete supplier"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}

                {activeTab === 'customers' && selectedCustomer && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenCollectCustomer(selectedCustomer)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-500 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Collect cash from customer"
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>Collect Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Edit customer details"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(selectedCustomer)}
                        className="h-6 px-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-500 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Delete customer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={loadAllData}
                  disabled={loading}
                  className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Reload list from database"
                >
                  <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Spreadsheet Data Grid - Maximized Vertical Space */}
          <div className="flex-1 min-h-[300px] flex flex-col border border-neutral-400 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col">
              {activeTab === 'suppliers' ? (
                /* Suppliers Table */
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                    <tr>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-12 text-center">
                        SN
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center font-mono">
                        Code
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">
                        Supplier Name
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36 font-mono">
                        Phone & Contact
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right font-mono">
                        Opening Due
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-right font-mono">
                        Current Due (Payable)
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">
                        Status
                      </th>
                      <th className="px-3 py-1.5 w-28 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            <span>Loading suppliers from database...</span>
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
                    ) : filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Truck className="w-8 h-8 text-neutral-400" />
                            <span>No suppliers found matching your filter criteria.</span>
                            <button
                              type="button"
                              onClick={handleOpenCreateSupplier}
                              className="mt-2 px-3 py-1 bg-[#006400] text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register New Supplier</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((s, idx) => {
                        const isSelected = selectedPartyId === s.id;
                        const dueAmount = Number(s.currentDue) || 0;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => setSelectedPartyId(s.id)}
                            onDoubleClick={() => handleOpenEditSupplier(s)}
                            className={`transition-colors ${
                              isSelected
                                ? 'bg-[#0056b3] text-white font-semibold cursor-pointer'
                                : idx % 2 === 0
                                ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                                : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                            }`}
                          >
                            {/* SN */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono">
                              {idx + 1}
                            </td>

                            {/* Code */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono font-bold">
                              {s.code ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    isSelected
                                      ? 'bg-blue-800 text-white'
                                      : 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700'
                                  }`}
                                >
                                  #{s.code}
                                </span>
                              ) : (
                                <span className={isSelected ? 'text-blue-200' : 'text-neutral-400 font-normal italic'}>
                                  --
                                </span>
                              )}
                            </td>

                            {/* Supplier Name */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Truck
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                                  }`}
                                />
                                <span>{s.name}</span>
                              </div>
                            </td>

                            {/* Phone & Contact */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono">
                              <div className="flex items-center gap-1">
                                <Phone className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-200' : 'text-neutral-400'}`} />
                                <span>{s.phone || '--'}</span>
                              </div>
                            </td>

                            {/* Opening Due */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono">
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-500 dark:text-neutral-400'}>
                                ৳{Number(s.openingDue || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* Current Due (Payable) */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono font-bold">
                              <span
                                className={
                                  isSelected
                                    ? 'text-white underline'
                                    : dueAmount > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-neutral-500 dark:text-neutral-400'
                                }
                              >
                                ৳{dueAmount.toLocaleString()}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                                  s.isActive
                                    ? isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {s.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-2 py-1 text-center">
                              <div
                                className="flex items-center justify-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaySupplier(s)}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-rose-700 border-white hover:bg-rose-50'
                                      : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700 hover:bg-rose-50'
                                  }`}
                                  title="Pay due balance"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSupplier(s)}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                      : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                  }`}
                                  title="Edit supplier details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSupplier(s)}
                                    className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-white text-rose-700 border-white hover:bg-rose-50'
                                        : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                    }`}
                                    title="Delete supplier"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                /* Customers Table */
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                    <tr>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-12 text-center">
                        SN
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center font-mono">
                        Code
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">
                        Customer Name
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36 font-mono">
                        Phone Number
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-right font-mono">
                        Opening Due
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32 text-right font-mono">
                        Current Due (Receivable)
                      </th>
                      <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">
                        Status
                      </th>
                      <th className="px-3 py-1.5 w-28 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                            <span>Loading customers from database...</span>
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
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-neutral-400" />
                            <span>No customers found matching your filter criteria.</span>
                            <button
                              type="button"
                              onClick={handleOpenCreateCustomer}
                              className="mt-2 px-3 py-1 bg-[#006400] text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register New Customer</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c, idx) => {
                        const isSelected = selectedPartyId === c.id;
                        const dueAmount = Number(c.currentDue) || 0;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedPartyId(c.id)}
                            onDoubleClick={() => handleOpenEditCustomer(c)}
                            className={`transition-colors ${
                              isSelected
                                ? 'bg-[#0056b3] text-white font-semibold cursor-pointer'
                                : idx % 2 === 0
                                ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                                : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 cursor-pointer'
                            }`}
                          >
                            {/* SN */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono">
                              {idx + 1}
                            </td>

                            {/* Code */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono font-bold">
                              {c.code ? (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                                    isSelected
                                      ? 'bg-blue-800 text-white'
                                      : 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700'
                                  }`}
                                >
                                  #{c.code}
                                </span>
                              ) : (
                                <span className={isSelected ? 'text-blue-200' : 'text-neutral-400 font-normal italic'}>
                                  --
                                </span>
                              )}
                            </td>

                            {/* Customer Name */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Users
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                                  }`}
                                />
                                <span>{c.name}</span>
                              </div>
                            </td>

                            {/* Phone Number */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono">
                              <div className="flex items-center gap-1">
                                <Phone className={`w-3 h-3 shrink-0 ${isSelected ? 'text-blue-200' : 'text-neutral-400'}`} />
                                <span>{c.phone || '--'}</span>
                              </div>
                            </td>

                            {/* Opening Due */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono">
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-500 dark:text-neutral-400'}>
                                ৳{Number(c.openingDue || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* Current Due (Receivable) */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-right font-mono font-bold">
                              <span
                                className={
                                  isSelected
                                    ? 'text-white underline'
                                    : dueAmount > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-neutral-500 dark:text-neutral-400'
                                }
                              >
                                ৳{dueAmount.toLocaleString()}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                                  c.isActive
                                    ? isSelected
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {c.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-2 py-1 text-center">
                              <div
                                className="flex items-center justify-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenCollectCustomer(c)}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-emerald-700 border-white hover:bg-emerald-50'
                                      : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title="Collect cash from customer"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCustomer(c)}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                      : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                  }`}
                                  title="Edit customer details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomer(c)}
                                    className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-white text-rose-700 border-white hover:bg-rose-50'
                                        : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                    }`}
                                    title="Delete customer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Total {activeTab === 'suppliers' ? 'Suppliers' : 'Customers'}: <strong>{currentListCount}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-900 dark:text-emerald-300">
                Active: <strong>{currentActiveCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-400">
                Inactive: <strong>{currentInactiveCount}</strong>
              </span>
              <span>•</span>
              <span className="text-amber-900 dark:text-amber-300">
                With Dues: <strong>{currentDueCount}</strong>
              </span>
              <span>•</span>
              <span>
                Total {activeTab === 'suppliers' ? 'Payables' : 'Receivables'}:{' '}
                <strong className={activeTab === 'suppliers' ? 'text-rose-900 dark:text-rose-400' : 'text-emerald-900 dark:text-emerald-300'}>
                  ৳{(activeTab === 'suppliers' ? totalSupplierDue : totalCustomerDue).toLocaleString()}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {activeTab === 'suppliers' && selectedSupplier ? (
                <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedSupplier.code ? `[#${selectedSupplier.code}] ` : ''}{selectedSupplier.name} [Due: ৳{Number(selectedSupplier.currentDue || 0).toLocaleString()}]
                </span>
              ) : activeTab === 'customers' && selectedCustomer ? (
                <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedCustomer.code ? `[#${selectedCustomer.code}] ` : ''}{selectedCustomer.name} [Due: ৳{Number(selectedCustomer.currentDue || 0).toLocaleString()}]
                </span>
              ) : (
                <span className="italic text-neutral-600 dark:text-neutral-400">
                  Tip: Double-click row to edit • Click Pay/Collect to record transaction
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Add / Edit Modal */}
      <SupplierModal
        open={isSupplierModalOpen}
        onOpenChange={setIsSupplierModalOpen}
        supplier={modalSupplier}
        onSuccess={() => {
          fetchSuppliers();
        }}
        onDelete={() => {
          setSelectedPartyId(null);
          fetchSuppliers();
        }}
      />

      {/* Customer Add / Edit Modal */}
      <CustomerModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        customer={modalCustomer}
        onSuccess={() => {
          fetchCustomers();
        }}
        onDelete={() => {
          setSelectedPartyId(null);
          fetchCustomers();
        }}
      />

      {/* Quick Payment / Cash Collection Modal */}
      <PartyPaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        type={paymentModalType}
        party={paymentTargetParty}
        onSuccess={() => {
          loadAllData();
        }}
      />
    </div>
  );
}
