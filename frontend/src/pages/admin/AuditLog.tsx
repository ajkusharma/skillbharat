import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { api } from '../../lib/api';
import type { AuditLogEntry, PageResponse } from '../../lib/types';
import { formatDateTime } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { humanAction } from './Dashboard';

export default function AdminAuditLog() {
  const [page, setPage] = useState(0);
  const list = useAsync(() => api.get<PageResponse<AuditLogEntry>>('/admin/audit-logs', { page, size: 25 }), [page]);

  return (
    <>
      <PageHeader title="Activity log" subtitle="Approvals, rejections, deactivations and employer decisions, newest first." />
      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (list.data?.items ?? []).length === 0 ? (
        <EmptyState icon={<ScrollText className="h-6 w-6" aria-hidden />} title="No activity yet" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Action</th><th>Details</th><th>By</th></tr></thead>
              <tbody>
                {list.data!.items.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-slate-600">{formatDateTime(e.createdAt)}</td>
                    <td className="font-medium">{humanAction(e.action)}</td>
                    <td className="max-w-md text-slate-700">{e.details}</td>
                    <td className="text-slate-600">{e.actorEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={setPage} />
        </>
      )}
    </>
  );
}
