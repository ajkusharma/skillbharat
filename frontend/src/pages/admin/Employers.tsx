import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { AdminCompany, CompanyStatus, PageResponse } from '../../lib/types';
import { companyStatusLabel, formatDate } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { CompanyBadge } from '../../components/StatusBadge';
import { RejectModal } from '../../components/RejectModal';

const statuses: (CompanyStatus | '')[] = ['', 'PENDING', 'APPROVED', 'REJECTED'];

export default function AdminEmployers() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;
  const [search, setSearch] = useState(q);
  const [rejecting, setRejecting] = useState<AdminCompany | null>(null);

  const list = useAsync(() => api.get<PageResponse<AdminCompany>>('/admin/employers', { status, q, page, size: 15 }), [status, q, page]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const act = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Employers" subtitle="Approve companies before they can post jobs." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by approval status">
          {statuses.map((s) => (
            <button
              key={s || 'all'}
              role="tab"
              aria-selected={status === s}
              onClick={() => update({ status: s })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'}`}
            >
              {s ? companyStatusLabel[s] : 'All'}
            </button>
          ))}
        </div>
        <form className="relative ml-auto w-full sm:w-72" onSubmit={(e: FormEvent) => { e.preventDefault(); update({ q: search.trim() }); }} role="search">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input className="input pl-9" placeholder="Search company or owner email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employers" />
        </form>
      </div>

      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (list.data?.items ?? []).length === 0 ? (
        <EmptyState icon={<Building2 className="h-6 w-6" aria-hidden />} title="No employers found" description="Try another status or search." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Company</th><th>Owner</th><th>Jobs</th><th>Registered</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {list.data!.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-slate-500">{[c.city, c.state].filter(Boolean).join(', ')}{c.industry ? `, ${c.industry}` : ''}</p>
                      {c.status === 'REJECTED' && c.rejectionReason && <p className="mt-1 max-w-xs text-xs text-red-700">Reason: {c.rejectionReason}</p>}
                    </td>
                    <td>
                      <p>{c.ownerName}</p>
                      <p className="text-xs text-slate-500">{c.ownerEmail}</p>
                      {!c.ownerActive && <p className="text-xs font-semibold text-red-700">Account deactivated</p>}
                    </td>
                    <td className="tabular-nums">{c.jobCount}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(c.createdAt)}</td>
                    <td><CompanyBadge status={c.status} /></td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        {c.status !== 'APPROVED' && <Button variant="success" small onClick={() => act(() => api.post(`/admin/employers/${c.id}/approve`), `${c.name} approved`)}>Approve</Button>}
                        {c.status !== 'REJECTED' && <Button variant="danger" small onClick={() => setRejecting(c)}>Reject</Button>}
                        <Button
                          variant="secondary"
                          small
                          onClick={() => act(() => api.patch(`/admin/users/${c.ownerId}/active`, { active: !c.ownerActive }), c.ownerActive ? 'Account deactivated' : 'Account activated')}
                        >
                          {c.ownerActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={(p) => update({ page: p > 0 ? String(p) : '' })} />
        </>
      )}

      <RejectModal
        open={rejecting !== null}
        title={`Reject ${rejecting?.name ?? 'employer'}`}
        onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          if (!rejecting) return;
          await act(() => api.post(`/admin/employers/${rejecting.id}/reject`, { reason }), `${rejecting.name} rejected`);
          setRejecting(null);
        }}
      />
    </>
  );
}
