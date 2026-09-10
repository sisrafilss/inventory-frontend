'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { ShieldCheck, Search, Eye, Filter, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(40);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  
  const [debouncedAction, setDebouncedAction] = useState('');
  const [debouncedEntity, setDebouncedEntity] = useState('');

  // Selected metadata modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedLogRow, setSelectedLogRow] = useState<AuditLog | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAction(actionFilter);
      setDebouncedEntity(entityFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [actionFilter, entityFilter]);

  const fetchLogs = async () => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      
      const res = await api.get<AuditLog[]>('/audit-logs', {
        page,
        limit,
        action: debouncedAction || undefined,
        entityType: debouncedEntity || undefined,
      });
      
      if (page === 1) setLogs(res.data);
      else setLogs(prev => [...prev, ...res.data]);
      
      if (res.meta) {
        setMeta({ total: res.meta.total || 0, totalPages: res.meta.totalPages || 1 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, debouncedAction, debouncedEntity]);

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading && !loadingMore && page < meta.totalPages) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col">
      <div className="w-full flex-1 min-h-0 flex flex-col border border-[#004d00] dark:border-emerald-900 rounded-xs bg-[#c6d8ea] dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        
        {/* Dark Green Banner Header */}
        <div className="bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 border-b border-[#004d00] dark:border-emerald-900 flex flex-wrap items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h1 className="text-lg font-bold tracking-wide">{t('audit.pageTitle')}</h1>
          </div>
        </div>

        {/* Gray Filter Bar */}
        <div className="bg-[#eaf1f8] dark:bg-slate-800/80 p-2 border-b border-neutral-300 dark:border-slate-700 shrink-0 flex flex-wrap gap-3 items-center text-sm">
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider">{t('audit.action')}:</label>
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. CREATE_SALE"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-40 h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider">{t('audit.entityType')}:</label>
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="e.g. Sale, Product"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-40 h-7 pl-7 pr-2 text-xs border border-neutral-400 dark:border-slate-600 rounded-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0056b3]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setActionFilter(''); setEntityFilter(''); }}
            className="h-7 px-3 bg-white dark:bg-slate-800 border border-neutral-400 dark:border-slate-600 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xs hover:bg-neutral-50 transition-colors shadow-sm ml-1"
          >
            Reset
          </button>
        </div>

        {/* Data Table */}
        <div 
          className="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-950 relative custom-scrollbar"
          onScroll={handleTableScroll}
        >
          <table className="w-full text-xs text-left min-w-[900px] border-collapse relative">
            <thead className="sticky top-0 bg-[#eaf1f8] dark:bg-slate-900 shadow-[0_1px_0_#9fbcd6] dark:shadow-[0_1px_0_#334155] z-10 text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              <tr>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-10 text-center">{t('common.sn')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-36">{t('audit.timestamp')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-48">{t('audit.actor')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-40">{t('audit.action')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-32">{t('audit.entityType')}</th>
                <th className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 w-48">{t('audit.entityId')}</th>
                <th className="px-3 py-1.5 text-center w-28">{t('audit.metadata')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
              {loading && page === 1 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-neutral-400" />
                      <span>No audit logs found matching criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {logs.map((log, idx) => {
                    const isSelected = selectedLogRow?.id === log.id;
                    
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0056b3] text-white font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white dark:bg-slate-900 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                            : 'bg-[#f4f8fc] dark:bg-slate-900/50 hover:bg-[#c6d8ea]/50 dark:hover:bg-slate-800/80'
                        }`}
                        onClick={() => setSelectedLogRow(log)}
                        onDoubleClick={() => log.metadata && setSelectedLog(log)}
                        title={log.metadata ? "Double-click to view metadata payload" : ""}
                      >
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-center font-mono ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>{idx + 1}</td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono ${isSelected ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          {log.actor ? (
                            <>
                              <span className={`font-semibold block ${isSelected ? 'text-white' : 'text-neutral-900 dark:text-neutral-100'}`}>{log.actor.name}</span>
                              <span className={`block text-[10px] uppercase ${isSelected ? 'text-blue-200' : 'text-neutral-500'}`}>
                                {log.actor.role}
                              </span>
                            </>
                          ) : (
                            <span className="italic opacity-60">System / Visitor</span>
                          )}
                        </td>
                        <td className="border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${
                            isSelected ? 'bg-[#006400] text-white border-emerald-500' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-slate-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-semibold ${isSelected ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {log.entityType}
                        </td>
                        <td className={`border-r border-neutral-300 dark:border-slate-700 px-3 py-1.5 font-mono truncate max-w-[200px] ${isSelected ? 'text-blue-100' : 'text-neutral-500'}`}>
                          {log.entityId || '—'}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {log.metadata ? (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                              className={`px-2 py-0.5 rounded-xs border text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                isSelected ? 'bg-white text-[#0056b3] border-white hover:bg-blue-50' : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-slate-700 hover:bg-neutral-100'
                              }`}
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                          ) : (
                            <span className="text-[10px] opacity-50">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {loadingMore && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-neutral-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#006400]" />
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
        <div className="bg-[#b0c8de] dark:bg-slate-800/90 px-3 py-1.5 border-t border-[#9fbcd6] dark:border-slate-700 flex items-center justify-between text-[11px] font-mono font-semibold text-neutral-800 dark:text-neutral-200 shrink-0">
          <div>
            {t('common.loaded')} <strong>{logs.length}</strong> {t('common.of')} <strong>{meta.total}</strong>
          </div>
          <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
            {selectedLogRow ? (
              <span className="bg-[#006400] text-white px-2 py-0.5 rounded-xs font-bold">
                Selected: {selectedLogRow.action} on {selectedLogRow.entityType}
              </span>
            ) : (
              <span className="italic text-neutral-600 dark:text-neutral-400 font-sans">
                {t('audit.tip')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Viewer Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        draggable={true}
        closeOnBackdropClick={false}
        className="p-0 max-w-2xl w-full border-2 border-[#004d00] dark:border-emerald-900 rounded-none bg-[#c6d8ea] dark:bg-slate-900 overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col">
          <div data-drag-handle className="relative bg-[#006400] dark:bg-emerald-950 py-1.5 px-4 select-none border-b border-[#004d00] dark:border-emerald-900 flex items-center justify-center cursor-grab active:cursor-grabbing">
            <h2 className="text-lg font-bold text-white tracking-wide">Audit Payload Metadata</h2>
            <button type="button" onClick={() => setSelectedLog(null)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/90 hover:text-white hover:bg-black/20 p-1 rounded-xs transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-4 bg-white dark:bg-slate-800 p-2 border border-neutral-300 dark:border-slate-700 shadow-sm text-xs">
              <div><span className="font-bold text-neutral-500 uppercase tracking-wider">Action:</span> <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{selectedLog?.action}</span></div>
              <div><span className="font-bold text-neutral-500 uppercase tracking-wider">Entity:</span> <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{selectedLog?.entityType}</span></div>
              <div><span className="font-bold text-neutral-500 uppercase tracking-wider">ID:</span> <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{selectedLog?.entityId}</span></div>
            </div>
            
            <div className="bg-[#1e1e1e] border border-neutral-700 p-3 rounded-xs overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
              <pre className="font-mono text-[11px] leading-relaxed text-[#d4d4d4]">
                {selectedLog ? JSON.stringify(selectedLog.metadata, null, 2) : ''}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setSelectedLog(null)} className="w-24 h-8 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-900 dark:text-neutral-100 border border-neutral-500 font-bold text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
