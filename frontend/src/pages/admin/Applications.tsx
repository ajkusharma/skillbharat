import { useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { api } from '../../lib/api';
import type { ApplicationRow, ApplicationStatus, PageResponse } from '../../lib/types';
import { applicationStatusLabel, formatDate } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { ApplicationBadge } from '../../components/StatusBadge';

const statuses: (ApplicationStatus | '')[] = ['', 'APPLIED', 'SHORTLISTED', 'REJECTED'];

export default function AdminApplications() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;

  const list = useAsync(() => api.get<PageResponse<ApplicationRow>>('/admin/applications', { status, page, size: 20 }), [status, page]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Applications" subtitle="Every application on the platform, read-only." />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {statuses.map((s) => (
          <button
            key={s || 'all'}
            role="tab"
            aria-selected={status === s}
            onClick={() => update({ status: s })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'}`}
          >
            {s ? applicationStatusLabel[s] : 'All'}
          </button>
        ))}
      </div>

      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (list.data?.items ?? []).length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-6 w-6" aria-hidden />} title="No applications" description="Nothing matches this filter." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Candidate</th><th>Job</th><th>Employer</th><th>Applied</th><th>Status</th></tr></thead>
              <tbody>
                {list.data!.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium">{a.candidateName}</p>
                      <p className="text-xs text-slate-500">{[a.candidateCity, a.candidateState].filter(Boolean).join(', ')}</p>
                    </td>
                    <td>{a.jobTitle}</td>
                    <td>{a.companyName}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(a.appliedAt)}</td>
                    <td><ApplicationBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={(p) => update({ page: p > 0 ? String(p) : '' })} />
        </>
      )}
    </>
  );
}
