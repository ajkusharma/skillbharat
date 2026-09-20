import { Link } from 'react-router-dom';
import { CircleCheck, PartyPopper } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { MyApplication, Profile } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { useAsync } from '../../hooks/useAsync';
import { Alert, EmptyState, ErrorState, PageHeader, ProgressBar, Spinner, StatCard } from '../../components/ui';
import { ApplicationBadge } from '../../components/StatusBadge';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const profile = useAsync(() => api.get<Profile>('/candidate/profile'), []);
  const apps = useAsync(() => api.get<MyApplication[]>('/candidate/applications'), []);

  if (profile.loading || apps.loading) return <Spinner />;
  if (profile.error || apps.error) {
    return <ErrorState message={(profile.error ?? apps.error)!} onRetry={() => { profile.reload(); apps.reload(); }} />;
  }

  const p = profile.data!;
  const list = apps.data ?? [];
  const count = (s: MyApplication['status']) => list.filter((a) => a.status === s).length;
  const shortlisted = list.filter((a) => a.status === 'SHORTLISTED');

  const todo: string[] = [];
  if (!p.city) todo.push('Add your location');
  if (!p.headline) todo.push('Write a one-line headline');
  if (p.skills.length === 0) todo.push('Choose your skills');
  if (p.education.length === 0) todo.push('Add your education or training');
  if (p.experience.length === 0) todo.push('Add your work experience');
  if (!p.resume) todo.push('Upload your resume');

  return (
    <>
      <PageHeader title={`Welcome, ${user?.fullName.split(' ')[0] ?? ''}`} subtitle="Here is where your job search stands." />

      {shortlisted.length > 0 && (
        <Alert tone="success" title={`Good news: you were shortlisted for ${shortlisted.length === 1 ? 'a job' : `${shortlisted.length} jobs`}`} className="mb-5">
          <span className="inline-flex items-center gap-1.5">
            <PartyPopper className="h-4 w-4" aria-hidden />
            {shortlisted.map((a) => `${a.jobTitle} at ${a.companyName}`).join('; ')}. The employer may contact you soon.
          </span>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Applied" value={count('APPLIED')} hint="Waiting for the employer" />
        <StatCard label="Shortlisted" value={count('SHORTLISTED')} tone={count('SHORTLISTED') > 0 ? 'good' : 'default'} />
        <StatCard label="Not selected" value={count('REJECTED')} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Profile strength</h2>
            <span className="text-sm font-semibold tabular-nums">{p.completeness}%</span>
          </div>
          <div className="mt-3"><ProgressBar value={p.completeness} /></div>
          {todo.length > 0 ? (
            <>
              <p className="mt-4 text-sm text-slate-600">Complete profiles get noticed first:</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {todo.map((t) => <li key={t} className="flex items-center gap-2 text-slate-700"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{t}</li>)}
              </ul>
              <Link to="/candidate/profile" className="btn btn-primary mt-5 w-full">Complete my profile</Link>
            </>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-success-ink"><CircleCheck className="h-4 w-4" aria-hidden /> Your profile is complete.</p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent applications</h2>
            {list.length > 0 && <Link to="/candidate/applications" className="text-sm font-medium text-brand-700 hover:underline">See all</Link>}
          </div>
          {list.length === 0 ? (
            <EmptyState
              title="You have not applied yet"
              description="Search jobs in your trade and apply in a few taps."
              action={<Link to="/jobs" className="btn btn-primary">Find jobs</Link>}
            />
          ) : (
            <ul className="card divide-y divide-slate-100">
              {list.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.jobTitle}</p>
                    <p className="truncate text-xs text-slate-500">{a.companyName}, applied {formatDate(a.appliedAt)}</p>
                  </div>
                  <ApplicationBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
          {list.length > 0 && <Link to="/jobs" className="btn btn-secondary btn-sm mt-3">Find more jobs</Link>}
        </section>
      </div>
    </>
  );
}
