import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BriefcaseBusiness, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { JobDetail, JobStatus, JobSummary, PageResponse } from '../../lib/types';
import { formatDate, jobStatusLabel, jobTypeLabel, salaryRange } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Button, EmptyState, ErrorState, Modal, PageHeader, Pagination, Spinner } from '../../components/ui';
import { JobBadge } from '../../components/StatusBadge';
import { RejectModal } from '../../components/RejectModal';

const statuses: (JobStatus | '')[] = ['', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT'];

export default function AdminJobs() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;
  const [search, setSearch] = useState(q);
  const [rejecting, setRejecting] = useState<JobSummary | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const list = useAsync(() => api.get<PageResponse<JobSummary>>('/admin/jobs', { status, q, page, size: 15 }), [status, q, page]);
  const preview = useAsync(() => (previewId ? api.get<JobDetail>(`/admin/jobs/${previewId}`) : Promise.resolve(undefined)), [previewId]);

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
      <PageHeader title="Jobs" subtitle="Approve jobs before they appear to job seekers. Switch off a live job at any time." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by job status">
          {statuses.map((s) => (
            <button
              key={s || 'all'}
              role="tab"
              aria-selected={status === s}
              onClick={() => update({ status: s })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'}`}
            >
              {s ? jobStatusLabel[s] : 'All'}
            </button>
          ))}
        </div>
        <form className="relative ml-auto w-full sm:w-72" onSubmit={(e: FormEvent) => { e.preventDefault(); update({ q: search.trim() }); }} role="search">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input className="input pl-9" placeholder="Search job or company" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search jobs" />
        </form>
      </div>

      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (list.data?.items ?? []).length === 0 ? (
        <EmptyState icon={<BriefcaseBusiness className="h-6 w-6" aria-hidden />} title="No jobs found" description="Try another status or search." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Job</th><th>Location</th><th>Applicants</th><th>Created</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {list.data!.items.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <button className="text-left font-medium text-brand-700 hover:underline" onClick={() => setPreviewId(j.id)}>{j.title}</button>
                      <p className="text-xs text-slate-500">{j.companyName}</p>
                    </td>
                    <td className="whitespace-nowrap">{j.city}, {j.state}</td>
                    <td className="tabular-nums">{j.applicationCount ?? 0}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(j.createdAt)}</td>
                    <td><JobBadge status={j.status} active={j.active} /></td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        {j.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button variant="success" small onClick={() => act(() => api.post(`/admin/jobs/${j.id}/approve`), 'Job approved and live')}>Approve</Button>
                            <Button variant="danger" small onClick={() => setRejecting(j)}>Reject</Button>
                          </>
                        )}
                        {j.status === 'APPROVED' && (
                          <Button variant="secondary" small onClick={() => act(() => api.patch(`/admin/jobs/${j.id}/active`, { active: !j.active }), j.active ? 'Job switched off' : 'Job switched on')}>
                            {j.active ? 'Switch off' : 'Switch on'}
                          </Button>
                        )}
                        <Button variant="secondary" small onClick={() => setPreviewId(j.id)}>View</Button>
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
        title={`Reject "${rejecting?.title ?? 'job'}"`}
        onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          if (!rejecting) return;
          await act(() => api.post(`/admin/jobs/${rejecting.id}/reject`, { reason }), 'Job rejected');
          setRejecting(null);
        }}
      />

      <Modal open={previewId !== null} title="Job details" onClose={() => setPreviewId(null)} footer={<Button variant="secondary" onClick={() => setPreviewId(null)}>Close</Button>}>
        {preview.loading ? (
          <Spinner />
        ) : preview.error || !preview.data ? (
          <p className="text-sm text-red-700">{preview.error}</p>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto text-sm">
            <div>
              <p className="text-lg font-semibold">{preview.data.title}</p>
              <p className="text-slate-600">{preview.data.companyName}, {preview.data.city}, {preview.data.state}</p>
            </div>
            <p className="text-slate-700">{jobTypeLabel[preview.data.jobType]}. {salaryRange(preview.data.salaryMin, preview.data.salaryMax) ?? 'Pay not stated'}. {preview.data.openings} openings.</p>
            <p className="whitespace-pre-line text-slate-700">{preview.data.description}</p>
            <div className="flex flex-wrap gap-1.5">{preview.data.skills.map((s) => <span key={s.id} className="chip">{s.name}</span>)}</div>
            {preview.data.rejectionReason && <p className="text-red-700">Rejection reason: {preview.data.rejectionReason}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
