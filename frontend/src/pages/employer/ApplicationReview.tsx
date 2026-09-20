import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, CircleX, FileText, GraduationCap, HardHat, Mail, MapPin, Phone } from 'lucide-react';
import { api, openResume } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { ApplicationDetail, ApplicationStatus } from '../../lib/types';
import { formatDate, formatDateTime } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Alert, Button, ErrorState, Spinner } from '../../components/ui';
import { ApplicationBadge } from '../../components/StatusBadge';

export default function ApplicationReview() {
  const { id } = useParams();
  const toast = useToast();
  const app = useAsync(() => api.get<ApplicationDetail>(`/employer/applications/${id}`), [id]);
  const [busy, setBusy] = useState<ApplicationStatus | null>(null);

  if (app.loading && !app.data) return <Spinner />;
  if (app.error || !app.data) return <ErrorState message={app.error ?? 'Application not found'} onRetry={app.reload} />;

  const a = app.data;
  const c = a.candidate;

  const decide = async (status: 'SHORTLISTED' | 'REJECTED') => {
    setBusy(status);
    try {
      await api.patch<ApplicationDetail>(`/employer/applications/${a.id}/status`, { status });
      toast.success(status === 'SHORTLISTED' ? `${c.fullName} has been shortlisted` : `${c.fullName} has been rejected`);
      app.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Link to={`/employer/applications?jobId=${a.jobId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to applications
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">{c.fullName}</h1>
                {c.headline && <p className="mt-1 text-slate-600">{c.headline}</p>}
              </div>
              <ApplicationBadge status={a.status} />
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              {(c.city || c.state) && <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" aria-hidden />{[c.city, c.state].filter(Boolean).join(', ')}</li>}
              {c.phone && <li className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-slate-400" aria-hidden /><a className="hover:underline" href={`tel:+91${c.phone}`}>+91 {c.phone}</a></li>}
              <li className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-slate-400" aria-hidden /><a className="hover:underline" href={`mailto:${c.email}`}>{c.email}</a></li>
              {c.totalExperienceYears != null && <li className="inline-flex items-center gap-1.5"><HardHat className="h-4 w-4 text-slate-400" aria-hidden />{c.totalExperienceYears} years of experience</li>}
            </ul>
            {c.summary && <p className="mt-4 max-w-prose whitespace-pre-line text-slate-700">{c.summary}</p>}
          </section>

          {a.coverNote && (
            <section className="card p-6">
              <h2 className="text-base font-semibold">Message from the candidate</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line text-slate-700">{a.coverNote}</p>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-base font-semibold">Skills</h2>
            {c.skills.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No skills listed.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">{c.skills.map((s) => <span key={s.id} className="chip">{s.name}</span>)}</div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-base font-semibold">Experience</h2>
            {c.experience.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No work history listed.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {c.experience.map((x, i) => (
                  <li key={i}>
                    <p className="font-medium">{x.jobTitle}{x.companyName ? ` at ${x.companyName}` : ''}</p>
                    <p className="text-xs text-slate-500">
                      {x.startDate ? formatDate(x.startDate) : 'Start date not given'} to {x.endDate ? formatDate(x.endDate) : 'present'}
                    </p>
                    {x.description && <p className="mt-1 text-sm text-slate-700">{x.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold"><GraduationCap className="h-4 w-4" aria-hidden />Education and training</h2>
            {c.education.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nothing listed.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {c.education.map((e, i) => (
                  <li key={i}><span className="font-medium">{e.degree}</span>{e.institution ? `, ${e.institution}` : ''}{e.yearOfCompletion ? ` (${e.yearOfCompletion})` : ''}</li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card sticky top-24 space-y-4 p-5">
            <div>
              <p className="text-xs text-slate-500">Applied for</p>
              <p className="font-semibold">{a.jobTitle}</p>
              <p className="text-xs text-slate-500">on {formatDateTime(a.appliedAt)}</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-semibold">Resume</p>
              {a.resumeId && a.resumeFilename ? (
                <Button variant="secondary" className="w-full" onClick={() => openResume(a.resumeId!, a.resumeFilename!).catch((e) => toast.error(errorMessage(e)))}>
                  <FileText className="h-4 w-4" aria-hidden /> View resume
                </Button>
              ) : (
                <Alert tone="info">This candidate applied without a resume.</Alert>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-semibold">Your decision</p>
              <div className="grid gap-2">
                <Button variant="success" loading={busy === 'SHORTLISTED'} disabled={a.status === 'SHORTLISTED' || busy !== null} onClick={() => decide('SHORTLISTED')}>
                  <CircleCheck className="h-4 w-4" aria-hidden /> {a.status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}
                </Button>
                <Button variant="danger" loading={busy === 'REJECTED'} disabled={a.status === 'REJECTED' || busy !== null} onClick={() => decide('REJECTED')}>
                  <CircleX className="h-4 w-4" aria-hidden /> {a.status === 'REJECTED' ? 'Rejected' : 'Reject'}
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">The candidate sees the new status in their applications straight away. You can change your decision later.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
