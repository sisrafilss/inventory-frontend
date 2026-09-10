'use client';
import { toast } from 'sonner';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Warehouse, Product } from '@/lib/types';
import {
  Warehouse as WarehouseIcon,
  Calendar as CalendarIcon,
  Search,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  RotateCcw,
  ArrowRightLeft,
  MapPin,
  Plus,
} from 'lucide-react';
import { WarehouseModal } from '@/components/warehouses/warehouse-modal';

export default function WarehousesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Current Date Display
  const [currentDate] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  });

  // Master Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Selected Warehouse in Table
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Warehouse Modal State (Add / Edit)
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [modalWarehouse, setModalWarehouse] = useState<Warehouse | null>(null);

  // Status Banner for notification
  const [statusBanner, setStatusBanner] = useState<{ text: string; isError: boolean } | null>(null);

  // Stock Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    sourceWarehouseId: '',
    targetWarehouseId: '',
    productId: '',
    quantity: 1,
    note: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // Fetch Warehouses List
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Warehouse[]>('/warehouses', { search });
      setWarehouses(res.data);
      // Keep selected warehouse in sync if it still exists
      if (selectedWarehouse) {
        const found = res.data.find((w) => w.id === selectedWarehouse.id);
        setSelectedWarehouse(found || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products for Transfer dropdown
  const fetchProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products', { limit: 200 });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products for transfer:', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      if (statusFilter === 'ACTIVE' && !wh.isActive) return false;
      if (statusFilter === 'INACTIVE' && wh.isActive) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchName = wh.name.toLowerCase().includes(q);
      const matchCode = wh.code?.toLowerCase().includes(q) || false;
      const matchAddress = wh.address?.toLowerCase().includes(q) || false;
      const matchId = wh.id.toLowerCase().includes(q);

      return matchName || matchCode || matchAddress || matchId;
    });
  }, [warehouses, statusFilter, search]);

  // Open Warehouse Modal for Creation
  const handleOpenCreateModal = () => {
    setModalWarehouse(null);
    setIsWarehouseModalOpen(true);
  };

  // Open Warehouse Modal for Editing
  const handleOpenEditModal = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setModalWarehouse(wh);
    setIsWarehouseModalOpen(true);
  };

  // Delete Warehouse directly
  const handleDeleteWarehouse = async (wh: Warehouse) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete warehouse "${wh.name}"?\n\nIf this location contains active inventory or past transaction records, delete will be blocked to maintain data integrity.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/warehouses/${wh.id}`);
      setStatusBanner({
        text: `Warehouse "${wh.name}" was successfully deleted.`,
        isError: false,
      });
      if (selectedWarehouse?.id === wh.id) {
        setSelectedWarehouse(null);
      }
      await fetchWarehouses();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete warehouse.',
        isError: true,
      });
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (defaultSourceId?: string) => {
    const srcId = defaultSourceId || selectedWarehouse?.id || warehouses[0]?.id || '';
    const tgt = warehouses.find((w) => w.id !== srcId);
    setTransferForm({
      sourceWarehouseId: srcId,
      targetWarehouseId: tgt?.id || '',
      productId: products[0]?.id || '',
      quantity: 1,
      note: '',
    });
    setTransferModalOpen(true);
  };

  // Execute Stock Transfer
  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.sourceWarehouseId || !transferForm.targetWarehouseId) {
      toast.warning('Please select both source and destination warehouses.');
      return;
    }
    if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
      toast.warning('Source and destination warehouses cannot be the same.');
      return;
    }
    if (transferForm.quantity <= 0) {
      toast.warning('Transfer quantity must be greater than 0.');
      return;
    }
    setIsTransferring(true);
    try {
      await api.post('/warehouses/transfer', {
        ...transferForm,
        quantity: Number(transferForm.quantity),
      });
      setStatusBanner({
        text: 'Stock successfully transferred between warehouses!',
        isError: false,
      });
      setTransferModalOpen(false);
      await fetchWarehouses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer stock.');
    } finally {
      setIsTransferring(false);
    }
  };

  const activeCount = warehouses.filter((w) => w.isActive).length;
  const inactiveCount = warehouses.filter((w) => !w.isActive).length;
  const defaultWarehouse = warehouses.find((w) => w.isDefault);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      {/* Desktop Main Window Frame */}
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏬</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              Warehouse / Godown Management
              <span className="hidden sm:inline text-[11px] font-normal text-emerald-200 tracking-normal border border-emerald-500/40 px-1.5 py-0.5 rounded-xs bg-emerald-900/30">
                STORAGE & MULTI-LOCATION REGISTRY
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-[#004d00]/60 border border-emerald-600/40 px-2 py-0.5 rounded-xs text-[11px] font-mono text-emerald-100 shadow-inner">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Date {currentDate}</span>
            </div>

            {/* Add Warehouse Modal Trigger Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3 py-1 text-xs font-bold bg-white text-[#006400] hover:bg-emerald-50 border border-white shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
              title="Add a new warehouse / godown"
            >
              <Plus className="w-3.5 h-3.5 text-[#006400] stroke-[3]" />
              <span>Add Warehouse</span>
            </button>

            {/* Transfer Stock Button */}
            <button
              type="button"
              onClick={() => handleOpenTransfer()}
              disabled={warehouses.length < 2 || products.length === 0}
              className="px-2.5 py-1 text-xs font-bold bg-[#004d00] hover:bg-emerald-900 text-white border border-emerald-600/60 shadow-xs flex items-center gap-1.5 rounded-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Transfer inventory stock between warehouses"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-300" />
              <span>Transfer Stock</span>
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

          {/* Search & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-[#dbe7f3] dark:bg-slate-800/60 rounded-xs border border-[#b2c8dc] dark:border-slate-700 shadow-inner shrink-0">
            {/* Search Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-xs shrink-0">
                Filter:
              </span>
              <div className="relative flex-1 sm:w-80">
                <input
                  type="text"
                  placeholder="Search by name, code, address, or ID..."
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

            {/* Quick Status Filter Tabs & Table Actions */}
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
                  All ({warehouses.length})
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
                  Active ({activeCount})
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
                  Inactive ({inactiveCount})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-300 dark:border-slate-700">
                {selectedWarehouse && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedWarehouse)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Edit selected warehouse"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWarehouse(selectedWarehouse)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-500 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Delete selected warehouse"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={fetchWarehouses}
                  disabled={loading}
                  className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Reload warehouse list from database"
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
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 border-b border-neutral-400 dark:border-slate-700 font-bold select-none text-xs z-10">
                  <tr>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-12 text-center">
                      SN
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">
                      Code
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[200px]">
                      Warehouse / Godown Name
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[220px]">
                      Location / Physical Address
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center">
                      Stock Types
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">
                      Default
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">
                      Status
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center font-mono">
                      System ID
                    </th>
                    <th className="px-3 py-1.5 w-28 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Loading warehouses from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-rose-600 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-neutral-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <WarehouseIcon className="w-8 h-8 text-neutral-400" />
                          <span>No warehouses found matching your filter criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="mt-2 px-3 py-1 bg-[#006400] text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Warehouse</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWarehouses.map((wh, idx) => {
                      const isSelected = selectedWarehouse?.id === wh.id;
                      return (
                        <tr
                          key={wh.id}
                          onClick={() => setSelectedWarehouse(wh)}
                          onDoubleClick={() => handleOpenEditModal(wh)}
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
                            {wh.code ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-xs ${
                                  isSelected
                                    ? 'bg-blue-800 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006400] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {wh.code}
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-normal">--</span>
                            )}
                          </td>

                          {/* Name */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold flex-1">
                            <div className="flex items-center gap-1.5">
                              <WarehouseIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              />
                              <span>{wh.name}</span>
                            </div>
                          </td>

                          {/* Address / Location */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-neutral-600 dark:text-neutral-400">
                            {wh.address ? (
                              <div className="flex items-center gap-1">
                                <MapPin
                                  className={`w-3 h-3 shrink-0 ${
                                    isSelected ? 'text-blue-200' : 'text-neutral-400'
                                  }`}
                                />
                                <span className={isSelected ? 'text-white' : ''}>{wh.address}</span>
                              </div>
                            ) : (
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-400'}>
                                --
                              </span>
                            )}
                          </td>

                          {/* Products Stocked */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded-xs font-mono font-bold ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700'
                              }`}
                            >
                              {wh._count?.stocks || 0}
                            </span>
                          </td>

                          {/* Default */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                            {wh.isDefault ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-xs font-bold inline-flex items-center gap-1 text-[11px] ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                Primary
                              </span>
                            ) : (
                              <span className={isSelected ? 'text-blue-200' : 'text-neutral-400 text-[11px]'}>
                                Secondary
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                                wh.isActive
                                  ? isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {wh.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* System ID */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono text-[11px]">
                            <span className={isSelected ? 'text-blue-200' : 'text-neutral-500'}>
                              {wh.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="px-2 py-1 text-center">
                            <div
                              className="flex items-center justify-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(wh)}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                                title="Edit warehouse details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTransfer(wh.id)}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-neutral-300 dark:border-slate-700 hover:bg-blue-50'
                                }`}
                                title="Transfer stock from this warehouse"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWarehouse(wh)}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-rose-700 border-white hover:bg-rose-50'
                                    : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                }`}
                                title="Delete warehouse"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Total Godowns: <strong>{warehouses.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-900 dark:text-emerald-300">
                Active: <strong>{activeCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-400">
                Inactive: <strong>{inactiveCount}</strong>
              </span>
              {defaultWarehouse && (
                <>
                  <span>•</span>
                  <span className="text-[#004d00] dark:text-emerald-300 font-bold">
                    Primary: {defaultWarehouse.name} {defaultWarehouse.code ? `(${defaultWarehouse.code})` : ''}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {selectedWarehouse ? (
                <span className="bg-[#004d00] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedWarehouse.name} {selectedWarehouse.code ? `[${selectedWarehouse.code}]` : ''}
                </span>
              ) : (
                <span className="italic text-neutral-600 dark:text-neutral-400">
                  Tip: Double-click a row or click Edit to modify details
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Add / Edit Desktop Modal */}
      <WarehouseModal
        open={isWarehouseModalOpen}
        onOpenChange={setIsWarehouseModalOpen}
        warehouse={modalWarehouse}
        onSuccess={() => {
          fetchWarehouses();
        }}
        onDelete={() => {
          setSelectedWarehouse(null);
          fetchWarehouses();
        }}
      />

      {/* Stock Transfer Desktop Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
            {/* Modal Header */}
            <div className="bg-[#006400] dark:bg-emerald-950 py-2 px-4 flex items-center justify-between border-b border-[#004d00] dark:border-emerald-900">
              <div className="flex items-center gap-2 text-white">
                <ArrowRightLeft className="w-4 h-4 text-emerald-300" />
                <h2 className="text-sm sm:text-base font-bold tracking-wide">
                  Transfer Stock Between Warehouses
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-xs text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTransferStock} className="p-4 space-y-3 text-xs text-neutral-900 dark:text-neutral-100">
              <div className="bg-[#dbe7f3] dark:bg-slate-800/60 p-3 rounded-xs border border-[#b2c8dc] dark:border-slate-700 space-y-3 shadow-inner">
                {/* Source & Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      From Warehouse (Source) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transferForm.sourceWarehouseId}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.code ? `[${w.code}]` : ''} {w.isDefault ? '★' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      To Warehouse (Target) <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transferForm.targetWarehouseId}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, targetWarehouseId: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    >
                      {warehouses
                        .filter((w) => w.id !== transferForm.sourceWarehouseId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.code ? `[${w.code}]` : ''} {w.isDefault ? '★' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Product to Move */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                    Product to Transfer <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={transferForm.productId}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, productId: e.target.value })
                    }
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ''} — Stock: {p.quantity} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transfer Quantity & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={transferForm.quantity}
                      onChange={(e) =>
                        setTransferForm({
                          ...transferForm,
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      Transfer Note / Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stock replenishment for showroom..."
                      value={transferForm.note}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, note: e.target.value })
                      }
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-neutral-400 dark:border-slate-600 rounded-xs text-xs focus:outline-none focus:ring-1 focus:ring-[#006400] text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a8c2dc] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  disabled={isTransferring}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 hover:bg-neutral-100 rounded-xs font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-4 py-1.5 bg-[#006400] text-white hover:bg-emerald-800 border border-[#004d00] rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isTransferring ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  )}
                  Execute Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
