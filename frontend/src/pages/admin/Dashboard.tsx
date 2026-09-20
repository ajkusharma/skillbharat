import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { AdminDashboard as Stats, ApplicationStatus, AuditLogEntry, PageResponse } from '../../lib/types';
import { applicationStatusLabel, timeAgo } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, PageHeader, Spinner, StatCard } from '../../components/ui';

export default function AdminDashboard() {
  const stats = useAsync(() => api.get<Stats>('/admin/dashboard'), []);
  const activity = useAsync(() => api.get<PageResponse<AuditLogEntry>>('/admin/audit-logs', { size: 8 }), []);

  if (stats.loading) return <Spinner />;
  if (stats.error || !stats.data) return <ErrorState message={stats.error ?? 'Could not load'} onRetry={stats.reload} />;
  const s = stats.data;

  const order: ApplicationStatus[] = ['APPLIED', 'SHORTLISTED', 'REJECTED'];
  const max = Math.max(1, ...order.map((k) => s.applicationsByStatus[k] ?? 0));
  const barTone: Record<ApplicationStatus, string> = { APPLIED: 'bg-brand-600', SHORTLISTED: 'bg-success', REJECTED: 'bg-slate-400' };

  return (
    <>
      <PageHeader title="Platform overview" subtitle="Everything that needs your attention, and how the marketplace is moving." />

      {(s.pendingEmployers > 0 || s.pendingJobs > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Link to="/admin/employers?status=PENDING" className="card flex items-center justify-between border-amber-300 p-4 hover:bg-amber-50">
            <span><span className="block text-2xl font-semibold tabular-nums">{s.pendingEmployers}</span><span className="text-sm text-slate-600">employers waiting for approval</span></span>
            <span className="btn btn-secondary btn-sm">Review</span>
          </Link>
          <Link to="/admin/jobs?status=PENDING_APPROVAL" className="card flex items-center justify-between border-amber-300 p-4 hover:bg-amber-50">
            <span><span className="block text-2xl font-semibold tabular-nums">{s.pendingJobs}</span><span className="text-sm text-slate-600">jobs waiting for approval</span></span>
            <span className="btn btn-secondary btn-sm">Review</span>
          </Link>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Job seekers" value={s.candidates} />
        <StatCard label="Employers" value={s.employers} />
        <StatCard label="Live jobs" value={s.liveJobs} hint={`${s.totalJobs} jobs in total`} tone="good" />
        <StatCard label="Applications" value={s.totalApplications} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-semibold">Applications by status</h2>
          <ul className="mt-4 space-y-3">
            {order.map((k) => {
              const n = s.applicationsByStatus[k] ?? 0;
              return (
                <li key={k}>
                  <div className="mb-1 flex justify-between text-sm"><span>{applicationStatusLabel[k]}</span><span className="font-semibold tabular-nums">{n}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${barTone[k]}`} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <Link to="/admin/applications" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">Monitor all applications</Link>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link to="/admin/audit" className="text-sm font-medium text-brand-700 hover:underline">Full log</Link>
          </div>
          {activity.loading ? (
            <p className="py-6 text-sm text-slate-500">Loading…</p>
          ) : activity.error ? (
            <p className="py-6 text-sm text-red-700">{activity.error}</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {(activity.data?.items ?? []).map((e) => (
                <li key={e.id} className="py-2.5 text-sm">
                  <p className="font-medium">{humanAction(e.action)}</p>
                  <p className="truncate text-xs text-slate-500">{e.details ? `${e.details}. ` : ''}By {e.actorEmail}, {timeAgo(e.createdAt).toLowerCase()}</p>
                </li>
              ))}
              {(activity.data?.items ?? []).length === 0 && <li className="py-4 text-sm text-slate-500">No activity yet.</li>}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export function humanAction(action: string): string {
  const s = action.replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
