'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ShieldCheck, Search, Eye, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Selected metadata modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AuditLog[]>('/audit-logs', {
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      });
      setLogs(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> {t('audit.title')}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('audit.subtitle')}
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <Input
              placeholder={t('audit.filterAction')}
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div>
            <Input
              placeholder={t('audit.filterEntity')}
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">{t('common.loading')}</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-destructive">{error}</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              {t('audit.noLogs')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b text-muted-foreground">
                  <tr className="text-left font-semibold">
                    <th className="p-3">{t('inventory.timestamp')}</th>
                    <th className="p-3">{t('audit.actor')}</th>
                    <th className="p-3">{t('audit.action')}</th>
                    <th className="p-3">{t('audit.entityType')}</th>
                    <th className="p-3">{t('audit.entityId')}</th>
                    <th className="p-3 text-right">{t('audit.payload')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="p-3">
                        {log.actor ? (
                          <>
                            <span className="font-semibold text-foreground block">{log.actor.name}</span>
                            <span className="text-[10px] text-muted-foreground block uppercase">
                              {log.actor.role} ({log.actor.email})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic">System / Visitor</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-medium">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground font-medium">{log.entityType}</td>
                      <td className="p-3 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">
                        {log.entityId || '—'}
                      </td>
                      <td className="p-3 text-right">
                        {log.metadata ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> {t('audit.viewMetadata')}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Modal */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogHeader>
          <DialogTitle>{t('audit.modalTitle')}</DialogTitle>
          <DialogDescription>
            {t('audit.action')}: <strong>{selectedLog?.action}</strong> on <strong>{selectedLog?.entityType}</strong>
          </DialogDescription>
        </DialogHeader>

        {selectedLog && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-muted/60 rounded-lg overflow-x-auto">
              <pre className="font-mono text-[11px] leading-relaxed text-foreground">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                {t('sales.close')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}

