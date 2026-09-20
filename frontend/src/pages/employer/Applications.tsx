import { Link, useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { api } from '../../lib/api';
import type { ApplicationRow, ApplicationStatus, JobSummary, PageResponse } from '../../lib/types';
import { applicationStatusLabel, formatDate } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { ApplicationBadge } from '../../components/StatusBadge';

export default function EmployerApplications() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get('jobId') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;

  const jobs = useAsync(() => api.get<JobSummary[]>('/employer/jobs'), []);
  const apps = useAsync(
    () => api.get<PageResponse<ApplicationRow>>('/employer/applications', { jobId, status, page, size: 15 }),
    [jobId, status, page],
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  return (
    <>
      <PageHeader title="Applications" subtitle="Review candidates, open their resume, then shortlist or reject." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
        <select className="input" aria-label="Filter by job" value={jobId} onChange={(e) => update({ jobId: e.target.value })}>
          <option value="">All jobs</option>
          {(jobs.data ?? []).map((j) => <option key={j.id} value={j.id}>{j.title} ({j.applicationCount ?? 0})</option>)}
        </select>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => update({ status: e.target.value })}>
          <option value="">Any status</option>
          {(['APPLIED', 'SHORTLISTED', 'REJECTED'] as ApplicationStatus[]).map((s) => <option key={s} value={s}>{applicationStatusLabel[s]}</option>)}
        </select>
      </div>

      {apps.loading && !apps.data ? (
        <Spinner />
      ) : apps.error ? (
        <ErrorState message={apps.error} onRetry={apps.reload} />
      ) : (apps.data?.items ?? []).length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden />}
          title="No applications found"
          description={jobId || status ? 'Try removing a filter.' : 'Applications appear here as soon as candidates apply to your live jobs.'}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Candidate</th><th>Job</th><th>Experience</th><th>Applied</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {apps.data!.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium">{a.candidateName}</p>
                      <p className="text-xs text-slate-500">{[a.candidateCity, a.candidateState].filter(Boolean).join(', ')}</p>
                      {a.candidateSkills.length > 0 && (
                        <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">{a.candidateSkills.slice(0, 3).join(', ')}</p>
                      )}
                    </td>
                    <td className="max-w-[220px]">{a.jobTitle}</td>
                    <td className="whitespace-nowrap">{a.candidateExperienceYears != null ? `${a.candidateExperienceYears} yr` : 'Not given'}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(a.appliedAt)}</td>
                    <td><ApplicationBadge status={a.status} /></td>
                    <td className="text-right"><Link to={`/employer/applications/${a.id}`} className="btn btn-secondary btn-sm">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={apps.data!.page} totalPages={apps.data!.totalPages} onPage={(p) => update({ page: p > 0 ? String(p) : '' })} />
        </>
      )}
    </>
  );
}
