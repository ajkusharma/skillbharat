import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { CITIES, JOB_TYPES, STATES, stateForCity } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import type { JobDetail, JobRequest, PublicMeta } from '../../lib/types';
import { jobTypeLabel } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Alert, Button, ErrorState, Field, PageHeader, Spinner } from '../../components/ui';
import { SkillPicker } from '../../components/SkillPicker';
import { JobBadge } from '../../components/StatusBadge';

const empty: JobRequest = {
  title: '', description: '', category: '', city: '', state: '', jobType: 'FULL_TIME',
  salaryMin: null, salaryMax: null, minExperienceYears: 0, openings: 1, skillIds: [],
};

const num = (v: string): number | null => (v === '' ? null : Math.max(0, Number(v)));

export default function JobForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const meta = useAsync(() => api.get<PublicMeta>('/public/meta'), []);
  const existing = useAsync(() => (id ? api.get<JobDetail>(`/employer/jobs/${id}`) : Promise.resolve(undefined)), [id]);

  const [form, setForm] = useState<JobRequest>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null);

  useEffect(() => {
    const j = existing.data;
    if (j) {
      setForm({
        title: j.title, description: j.description, category: j.category, city: j.city, state: j.state,
        jobType: j.jobType, salaryMin: j.salaryMin ?? null, salaryMax: j.salaryMax ?? null,
        minExperienceYears: j.minExperienceYears, openings: j.openings, skillIds: j.skills.map((s) => s.id),
      });
    }
  }, [existing.data]);

  if ((editing && existing.loading) || meta.loading) return <Spinner />;
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  if (meta.error || !meta.data) return <ErrorState message={meta.error ?? 'Could not load categories'} onRetry={meta.reload} />;

  const job = existing.data;
  const set = <K extends keyof JobRequest>(key: K, value: JobRequest[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Enter a job title';
    if (!form.category) e.category = 'Choose a trade category';
    if (!form.city.trim()) e.city = 'Enter the city';
    if (!form.state.trim()) e.state = 'Choose the state';
    if (form.description.trim().length < 20) e.description = 'Describe the job in at least 20 characters';
    if (form.salaryMin != null && form.salaryMax != null && form.salaryMax < form.salaryMin) e.salaryMax = 'Maximum cannot be lower than minimum';
    if (form.openings < 1) e.openings = 'At least 1 opening';
    return e;
  };

  const save = async (submit: boolean) => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setBusy(submit ? 'submit' : 'draft');
    try {
      const saved = editing
        ? await api.put<JobDetail>(`/employer/jobs/${id}`, form)
        : await api.post<JobDetail>('/employer/jobs', form);
      if (submit) {
        await api.post(`/employer/jobs/${saved.id}/submit`);
        toast.success('Submitted for approval. An admin will review it soon.');
      } else {
        toast.success('Draft saved');
      }
      navigate('/employer/jobs');
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title={editing ? 'Edit job' : 'Post a job'}
        subtitle="Be specific about the work, pay and location. Clear jobs get better applicants."
        actions={job ? <JobBadge status={job.status} active={job.active} /> : undefined}
      />

      {job?.status === 'REJECTED' && (
        <Alert tone="error" title="This job was rejected" className="mb-5">
          {job.rejectionReason ?? 'Please review the job details.'} Update it and submit again.
        </Alert>
      )}
      {job?.status === 'APPROVED' && (
        <Alert tone="warning" title="This job is live" className="mb-5">
          Saving changes takes it offline until an admin approves the updated version.
        </Alert>
      )}

      <div className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" htmlFor="title" error={errors.title} className="sm:col-span-2">
            <input id="title" maxLength={150} className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. CNC Operator (Fanuc)" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Trade category" htmlFor="category" error={errors.category}>
            <select id="category" className={`input ${errors.category ? 'input-error' : ''}`} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {meta.data.categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </Field>
          <Field label="Job type" htmlFor="type">
            <select id="type" className="input" value={form.jobType} onChange={(e) => set('jobType', e.target.value as JobRequest['jobType'])}>
              {JOB_TYPES.map((t) => <option key={t} value={t}>{jobTypeLabel[t]}</option>)}
            </select>
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <input
              id="city"
              list="job-cities"
              className={`input ${errors.city ? 'input-error' : ''}`}
              value={form.city}
              onChange={(e) => {
                set('city', e.target.value);
                const guess = stateForCity(e.target.value);
                if (guess) set('state', guess);
              }}
            />
            <datalist id="job-cities">{CITIES.map((c) => <option key={c.city} value={c.city} />)}</datalist>
          </Field>
          <Field label="State" htmlFor="state" error={errors.state}>
            <select id="state" className={`input ${errors.state ? 'input-error' : ''}`} value={form.state} onChange={(e) => set('state', e.target.value)}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Monthly pay from (₹)" htmlFor="smin">
            <input id="smin" type="number" min={0} className="input" value={form.salaryMin ?? ''} onChange={(e) => set('salaryMin', num(e.target.value))} />
          </Field>
          <Field label="Monthly pay up to (₹)" htmlFor="smax" error={errors.salaryMax}>
            <input id="smax" type="number" min={0} className={`input ${errors.salaryMax ? 'input-error' : ''}`} value={form.salaryMax ?? ''} onChange={(e) => set('salaryMax', num(e.target.value))} />
          </Field>
          <Field label="Minimum experience (years)" htmlFor="exp" hint="0 means freshers can apply">
            <input id="exp" type="number" min={0} max={50} className="input" value={form.minExperienceYears} onChange={(e) => set('minExperienceYears', num(e.target.value) ?? 0)} />
          </Field>
          <Field label="Openings" htmlFor="openings" error={errors.openings}>
            <input id="openings" type="number" min={1} className="input" value={form.openings} onChange={(e) => set('openings', num(e.target.value) ?? 1)} />
          </Field>
        </div>

        <Field label="Job description" htmlFor="description" error={errors.description} hint="Work to be done, shift timings, benefits such as PF, food or accommodation">
          <textarea id="description" maxLength={5000} className={`input min-h-[160px] ${errors.description ? 'input-error' : ''}`} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div>
          <p className="label">Skills required</p>
          <SkillPicker skills={meta.data.skills} selected={form.skillIds} onChange={(ids) => set('skillIds', ids)} max={15} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={() => navigate('/employer/jobs')} disabled={busy !== null}>Cancel</Button>
          <Button variant="secondary" loading={busy === 'draft'} disabled={busy === 'submit'} onClick={() => save(false)}>Save as draft</Button>
          <Button loading={busy === 'submit'} disabled={busy === 'draft'} onClick={() => save(true)}>Save and submit for approval</Button>
        </div>
      </div>
    </>
  );
}
