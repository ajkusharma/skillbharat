import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import type { ApplicationStatus, MyApplication } from '../../lib/types';
import { applicationStatusLabel, formatDate, timeAgo } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, PageHeader, SkeletonList } from '../../components/ui';
import { ApplicationBadge } from '../../components/StatusBadge';

const filters: (ApplicationStatus | 'ALL')[] = ['ALL', 'APPLIED', 'SHORTLISTED', 'REJECTED'];

export default function MyApplications() {
  const apps = useAsync(() => api.get<MyApplication[]>('/candidate/applications'), []);
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');

  const all = apps.data ?? [];
  const shown = filter === 'ALL' ? all : all.filter((a) => a.status === filter);
  const countOf = (f: ApplicationStatus | 'ALL') => (f === 'ALL' ? all.length : all.filter((a) => a.status === f).length);

  return (
    <>
      <PageHeader title="My applications" subtitle="Every job you applied to, with the employer's latest decision." />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {filters.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              filter === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'
            }`}
          >
            {f === 'ALL' ? 'All' : applicationStatusLabel[f]} <span className="opacity-70">({countOf(f)})</span>
          </button>
        ))}
      </div>

      {apps.loading ? (
        <SkeletonList rows={3} />
      ) : apps.error ? (
        <ErrorState message={apps.error} onRetry={apps.reload} />
      ) : shown.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? 'No applications yet' : 'Nothing in this status'}
          description={all.length === 0 ? 'When you apply to a job it will show up here.' : 'Try another status above.'}
          action={all.length === 0 ? <Link to="/jobs" className="btn btn-primary">Find jobs</Link> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => (
            <li key={a.id} className={`card p-5 ${a.status === 'SHORTLISTED' ? 'border-green-300' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">
                    {a.jobStillOpen ? <Link to={`/jobs/${a.jobId}`} className="hover:text-brand-700">{a.jobTitle}</Link> : a.jobTitle}
                  </h2>
                  <p className="text-sm text-slate-600">{a.companyName}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden />{a.city}, {a.state}</p>
                </div>
                <ApplicationBadge status={a.status} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Applied on {formatDate(a.appliedAt)}
                {a.status !== 'APPLIED' && <>. Updated {timeAgo(a.updatedAt).toLowerCase()}</>}
                {!a.jobStillOpen && <>. This job is no longer open</>}
              </p>
              {a.status === 'SHORTLISTED' && (
                <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-sm text-success-ink">
                  The employer shortlisted you. Keep your phone reachable, they may call soon.
                </p>
              )}
              {a.coverNote && <p className="mt-3 border-l-2 border-slate-200 pl-3 text-sm text-slate-600">{a.coverNote}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
