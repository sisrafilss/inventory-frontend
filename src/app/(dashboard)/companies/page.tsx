'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/context/auth-context';
import { Company } from '@/lib/types';
import {
  Building2,
  Calendar as CalendarIcon,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { CompanyModal } from '@/components/companies/company-modal';

export default function CompaniesPage() {
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Selected Company in Table
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Company Modal State (Add / Edit)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [modalCompany, setModalCompany] = useState<Company | null>(null);

  // Status Banner for notification
  const [statusBanner, setStatusBanner] = useState<{ text: string; isError: boolean } | null>(null);

  // Fetch Companies List
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Company[]>('/companies', { search });
      setCompanies(res.data);
      // Keep selected company in sync if it still exists
      if (selectedCompany) {
        const found = res.data.find((c) => c.id === selectedCompany.id);
        setSelectedCompany(found || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter === 'ACTIVE' && !c.isActive) return false;
      if (statusFilter === 'INACTIVE' && c.isActive) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code ? c.code.toLowerCase().includes(q) : false;
      const matchDesc = c.description ? c.description.toLowerCase().includes(q) : false;
      const matchId = c.id.toLowerCase().includes(q);

      return matchName || matchCode || matchDesc || matchId;
    });
  }, [companies, statusFilter, search]);

  // Open Company Modal for Creation
  const handleOpenCreateModal = () => {
    setModalCompany(null);
    setIsCompanyModalOpen(true);
  };

  // Open Company Modal for Editing
  const handleOpenEditModal = (comp: Company) => {
    setSelectedCompany(comp);
    setModalCompany(comp);
    setIsCompanyModalOpen(true);
  };

  // Delete Company directly
  const handleDeleteCompany = async (comp: Company) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete company "${comp.name}"?\n\nIf this manufacturer is linked to existing products or past transactions, delete will be blocked to maintain data integrity.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/companies/${comp.id}`);
      setStatusBanner({
        text: `Company "${comp.name}" was successfully deleted.`,
        isError: false,
      });
      if (selectedCompany?.id === comp.id) {
        setSelectedCompany(null);
      }
      await fetchCompanies();
    } catch (err: any) {
      setStatusBanner({
        text: err.message || 'Failed to delete company.',
        isError: true,
      });
    }
  };

  const activeCount = companies.filter((c) => c.isActive).length;
  const inactiveCount = companies.filter((c) => !c.isActive).length;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      {/* Desktop Main Window Frame */}
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dark Green Banner Header */}
        <div className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2 pointer-events-none">
              Company / Brand Management
              <span className="text-[11px] font-mono font-normal text-emerald-200 uppercase tracking-widest hidden sm:inline border border-emerald-500/40 px-1.5 py-0.5 rounded-xs bg-emerald-900/30">
                [MANUFACTURER REGISTRY]
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Date Box */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#004d00]/60 border border-emerald-600/40 px-2 py-0.5 rounded-xs text-[11px] font-mono text-emerald-100 shadow-inner">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-300" />
              <span>Date {currentDate}</span>
            </div>

            {/* Add Company Modal Trigger Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3 py-1 text-xs font-bold bg-white text-[#006400] hover:bg-emerald-50 border border-white shadow-xs flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer"
              title="Add a new company / brand"
            >
              <Plus className="w-3.5 h-3.5 text-[#006400] stroke-[3]" />
              <span>Add Company</span>
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
                  placeholder="Search by name, 3-digit code, or ID..."
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
                  All ({companies.length})
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
                {selectedCompany && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(selectedCompany)}
                      className="h-6 px-2 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-600 hover:bg-emerald-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Edit selected company"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(selectedCompany)}
                        className="h-6 px-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-500 hover:bg-rose-50 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Delete selected company"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={fetchCompanies}
                  disabled={loading}
                  className="h-6 px-2 bg-white dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border border-neutral-400 dark:border-slate-600 hover:bg-neutral-100 rounded-xs font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Reload company list from database"
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
                      Company / Brand Name
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 min-w-[220px]">
                      Description
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-24 text-center">
                      Products
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-20 text-center">
                      Status
                    </th>
                    <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-28 text-center font-mono">
                      System ID
                    </th>
                    <th className="px-3 py-1.5 w-24 text-center">
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
                          <span>Loading companies from database...</span>
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
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-neutral-500 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Building2 className="w-8 h-8 text-neutral-400" />
                          <span>No companies found matching your filter criteria.</span>
                          <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            className="mt-2 px-3 py-1 bg-[#006400] text-white rounded-xs font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Company</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((comp, idx) => {
                      const isSelected = selectedCompany?.id === comp.id;
                      return (
                        <tr
                          key={comp.id}
                          onClick={() => setSelectedCompany(comp)}
                          onDoubleClick={() => handleOpenEditModal(comp)}
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
                            {comp.code ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-xs ${
                                  isSelected
                                    ? 'bg-blue-800 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#006400] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                #{comp.code}
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-normal">--</span>
                            )}
                          </td>

                          {/* Company / Brand Name */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold flex-1">
                            <div className="flex items-center gap-1.5">
                              <Building2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              />
                              <span>{comp.name}</span>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                            <span className={isSelected ? 'text-blue-100' : ''}>
                              {comp.description || '--'}
                            </span>
                          </td>

                          {/* Products Count */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded-xs font-mono font-bold ${
                                isSelected
                                  ? 'bg-blue-800 text-white'
                                  : 'bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-slate-700'
                              }`}
                            >
                              {comp._count?.products ?? 0}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-xs text-[10px] font-bold tracking-wider uppercase ${
                                comp.isActive
                                  ? isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isSelected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {comp.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* System ID */}
                          <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono text-[11px]">
                            <span className={isSelected ? 'text-blue-200' : 'text-neutral-500'}>
                              {comp.id.slice(0, 8).toUpperCase()}
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
                                onClick={() => handleOpenEditModal(comp)}
                                className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-white text-blue-700 border-white hover:bg-blue-50'
                                    : 'bg-white dark:bg-slate-800 text-[#006400] dark:text-emerald-400 border-neutral-300 dark:border-slate-700 hover:bg-emerald-50'
                                }`}
                                title="Edit company details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCompany(comp)}
                                  className={`p-1 rounded-xs border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-white text-rose-700 border-white hover:bg-rose-50'
                                      : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-neutral-300 dark:border-slate-700 hover:bg-rose-50'
                                  }`}
                                  title="Delete company"
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
            </div>
          </div>

          {/* Bottom Status / Summary Bar */}
          <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border border-[#9fbcd6] dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Total Records: <strong>{companies.length}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-900 dark:text-emerald-300">
                Active: <strong>{activeCount}</strong>
              </span>
              <span>•</span>
              <span className="text-rose-900 dark:text-rose-400">
                Inactive: <strong>{inactiveCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              {selectedCompany ? (
                <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                  Selected: {selectedCompany.name} {selectedCompany.code ? `[#${selectedCompany.code}]` : ''}
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

      {/* Company Add / Edit Desktop Modal */}
      <CompanyModal
        open={isCompanyModalOpen}
        onOpenChange={setIsCompanyModalOpen}
        company={modalCompany}
        onSuccess={() => {
          fetchCompanies();
        }}
        onDelete={() => {
          setSelectedCompany(null);
          fetchCompanies();
        }}
      />
    </div>
  );
}
