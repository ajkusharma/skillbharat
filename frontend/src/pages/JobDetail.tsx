import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Briefcase, Building2, Clock, ExternalLink, MapPin, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ApplicationStatus, JobDetail as Job } from '../lib/types';
import { experienceLabel, formatDate, jobTypeLabel, salaryRange } from '../lib/format';
import { errorMessage, useAsync } from '../hooks/useAsync';
import { Alert, Button, EmptyState, ErrorState, Modal, Spinner } from '../components/ui';
import { ApplicationBadge } from '../components/StatusBadge';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const job = useAsync(() => api.get<Job>(`/public/jobs/${id}`), [id, user?.id]);

  const [applyOpen, setApplyOpen] = useState(false);
  const [note, setNote] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [savingBookmark, setSavingBookmark] = useState(false);

  if (job.loading && !job.data) return <Spinner label="Loading job" />;
  if (job.error || !job.data) {
    const notFound = job.error?.toLowerCase().includes('not found') || job.error?.toLowerCase().includes('no longer open');
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        {notFound ? (
          <EmptyState
            title="This job is no longer open"
            description="The employer may have filled the role or taken it down."
            action={<Link to="/jobs" className="btn btn-primary">Browse other jobs</Link>}
          />
        ) : (
          <ErrorState message={job.error ?? 'Job not found'} onRetry={job.reload} />
        )}
      </div>
    );
  }

  const j = job.data;
  const salary = salaryRange(j.salaryMin, j.salaryMax);
  const viewer = j.viewer;
  const isSeeker = user?.role === 'JOB_SEEKER';

  const submitApplication = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      await api.post(`/candidate/jobs/${j.id}/apply`, { coverNote: note.trim() || undefined });
      setApplyOpen(false);
      setNote('');
      toast.success('Application sent. Track it under My applications.');
      job.reload();
    } catch (e) {
      setApplyError(errorMessage(e));
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    setSavingBookmark(true);
    try {
      if (viewer?.saved) {
        await api.del(`/candidate/saved-jobs/${j.id}`);
        toast.success('Removed from saved jobs');
      } else {
        await api.post(`/candidate/saved-jobs/${j.id}`);
        toast.success('Job saved');
      }
      job.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSavingBookmark(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All jobs
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h1 className="text-2xl font-semibold leading-tight md:text-[28px]">{j.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-slate-600"><Building2 className="h-4 w-4" aria-hidden /> {j.companyName}</p>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
              <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" aria-hidden />{j.city}, {j.state}</li>
              <li className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-slate-400" aria-hidden />{jobTypeLabel[j.jobType]}</li>
              <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" aria-hidden />{experienceLabel(j.minExperienceYears)}</li>
              <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" aria-hidden />{j.openings} {j.openings === 1 ? 'opening' : 'openings'}</li>
            </ul>
            {salary && <p className="mt-4 text-xl font-semibold text-brand-800">{salary}</p>}
            {j.postedAt && <p className="mt-1 text-xs text-slate-500">Posted on {formatDate(j.postedAt)}</p>}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">About this job</h2>
            <p className="mt-3 max-w-prose whitespace-pre-line leading-7 text-slate-700">{j.description}</p>
            {j.skills.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold">Skills needed</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {j.skills.map((s) => <span key={s.id} className="chip">{s.name}</span>)}
                </div>
              </>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">About {j.companyName}</h2>
            {j.companyIndustry && <p className="mt-1 text-sm text-slate-500">{j.companyIndustry}</p>}
            {j.companyDescription && <p className="mt-3 max-w-prose whitespace-pre-line text-slate-700">{j.companyDescription}</p>}
            {j.companyWebsite && (
              <a href={j.companyWebsite} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                Company website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </section>
        </div>

        <aside>
          <div className="card sticky top-24 p-5">
            {!user && (
              <>
                <h2 className="text-base font-semibold">Interested in this job?</h2>
                <p className="mt-1 text-sm text-slate-600">Sign in or create a free account to apply.</p>
                <div className="mt-4 grid gap-2">
                  <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">Sign in to apply</Link>
                  <Link to="/register" className="btn btn-secondary">Create account</Link>
                </div>
              </>
            )}

            {isSeeker && viewer?.applied && (
              <>
                <h2 className="text-base font-semibold">You have applied</h2>
                <div className="mt-2"><ApplicationBadge status={viewer.applicationStatus as ApplicationStatus} /></div>
                <p className="mt-3 text-sm text-slate-600">We will show any update from the employer in your applications.</p>
                <Link to="/candidate/applications" className="btn btn-secondary mt-4 w-full">View my applications</Link>
              </>
            )}

            {isSeeker && !viewer?.applied && (
              <>
                <h2 className="text-base font-semibold">Ready to apply?</h2>
                <p className="mt-1 text-sm text-slate-600">Your profile and latest resume are sent to the employer.</p>
                <Button className="mt-4 w-full" onClick={() => { setApplyError(null); setApplyOpen(true); }}>Apply now</Button>
              </>
            )}

            {isSeeker && (
              <Button variant="secondary" className="mt-2 w-full" loading={savingBookmark} onClick={toggleSave}>
                {viewer?.saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
                {viewer?.saved ? 'Saved' : 'Save job'}
              </Button>
            )}

            {user && !isSeeker && (
              <Alert tone="info" title="Viewing as a non job seeker">
                Sign in with a job seeker account to apply for jobs.
              </Alert>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={applyOpen}
        title={`Apply to ${j.title}`}
        onClose={() => setApplyOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button loading={applying} onClick={submitApplication}>Send application</Button>
          </>
        }
      >
        <label className="label" htmlFor="cover">Message to the employer (optional)</label>
        <textarea
          id="cover"
          className="input min-h-[110px]"
          maxLength={1000}
          placeholder="Tell them about your experience and when you can start."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-slate-500">{note.length}/1000</p>
        {applyError && (
          <Alert tone="error" className="mt-3">
            {applyError}{' '}
            {applyError.toLowerCase().includes('profile') && (
              <Link to="/candidate/profile" className="font-semibold underline">Complete your profile</Link>
            )}
          </Alert>
        )}
      </Modal>
    </div>
  );
}
