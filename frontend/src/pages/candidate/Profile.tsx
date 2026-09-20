import { useEffect, useRef, useState } from 'react';
import { FileText, Plus, Trash2, Upload } from 'lucide-react';
import { api, ApiError, openResume } from '../../lib/api';
import { CITIES, STATES, stateForCity } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import type { Education, Experience, Profile, ProfileRequest, PublicMeta } from '../../lib/types';
import { fileSize, formatDate } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Alert, Button, ErrorState, Field, PageHeader, ProgressBar, Spinner } from '../../components/ui';
import { SkillPicker } from '../../components/SkillPicker';

const PHONE = /^[6-9][0-9]{9}$/;
const MAX_RESUME = 5 * 1024 * 1024;

function toForm(p: Profile): ProfileRequest {
  return {
    fullName: p.fullName,
    phone: p.phone ?? '',
    headline: p.headline ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    summary: p.summary ?? '',
    totalExperienceYears: p.totalExperienceYears ?? null,
    skillIds: p.skills.map((s) => s.id),
    education: p.education.map((e) => ({ ...e })),
    experience: p.experience.map((x) => ({ ...x })),
  };
}

export default function CandidateProfile() {
  const toast = useToast();
  const profile = useAsync(() => api.get<Profile>('/candidate/profile'), []);
  const meta = useAsync(() => api.get<PublicMeta>('/public/meta'), []);

  const [form, setForm] = useState<ProfileRequest | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile.data) setForm(toForm(profile.data));
  }, [profile.data]);

  if (profile.loading && !form) return <Spinner label="Loading your profile" />;
  if (profile.error && !form) return <ErrorState message={profile.error} onRetry={profile.reload} />;
  if (!form || !profile.data) return null;

  const p = profile.data;
  const set = <K extends keyof ProfileRequest>(key: K, value: ProfileRequest[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Enter your full name';
    if (!PHONE.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.city.trim()) e.city = 'Enter your city';
    if (!form.state.trim()) e.state = 'Choose your state';
    if (form.education.some((x) => !x.degree.trim())) e.education = 'Each education entry needs a course or certificate name';
    if (form.experience.some((x) => !x.jobTitle.trim())) e.experience = 'Each experience entry needs a job title';
    return e;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const body: ProfileRequest = {
        ...form,
        fullName: form.fullName.trim(),
        education: form.education.map((x) => ({ ...x, institution: x.institution || null, yearOfCompletion: x.yearOfCompletion || null })),
        experience: form.experience.map((x) => ({ ...x, startDate: x.startDate || null, endDate: x.endDate || null })),
      };
      await api.put<Profile>('/candidate/profile', body);
      toast.success('Profile saved');
      profile.reload();
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors);
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setResumeError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) return setResumeError('Upload a PDF, DOC or DOCX file.');
    if (file.size > MAX_RESUME) return setResumeError('The file is larger than 5 MB. Upload a smaller file.');
    setUploading(true);
    try {
      await api.upload('/candidate/resume', file);
      toast.success('Resume uploaded');
      profile.reload();
    } catch (e) {
      setResumeError(errorMessage(e));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const updateEdu = (i: number, patch: Partial<Education>) => set('education', form.education.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const updateExp = (i: number, patch: Partial<Experience>) => set('experience', form.experience.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Employers see this when you apply. Keep it accurate."
        actions={<Button onClick={save} loading={saving}>Save profile</Button>}
      />

      <div className="card mb-6 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Profile strength</span>
          <span className="font-semibold tabular-nums">{p.completeness}%</span>
        </div>
        <ProgressBar value={p.completeness} />
      </div>

      <div className="space-y-6">
        <section className="card space-y-4 p-5">
          <h2 className="text-base font-semibold">Contact and location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
              <input id="fullName" className={`input ${errors.fullName ? 'input-error' : ''}`} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="Employers may call this number">
              <input id="phone" inputMode="numeric" maxLength={10} className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Email" htmlFor="email" hint="Your sign-in email cannot be changed here">
              <input id="email" className="input bg-slate-50" value={p.email} readOnly />
            </Field>
            <span className="hidden sm:block" />
            <Field label="City" htmlFor="city" error={errors.city}>
              <input
                id="city"
                list="profile-cities"
                className={`input ${errors.city ? 'input-error' : ''}`}
                value={form.city}
                onChange={(e) => {
                  set('city', e.target.value);
                  const guess = stateForCity(e.target.value);
                  if (guess) set('state', guess);
                }}
              />
              <datalist id="profile-cities">{CITIES.map((c) => <option key={c.city} value={c.city} />)}</datalist>
            </Field>
            <Field label="State" htmlFor="state" error={errors.state}>
              <select id="state" className={`input ${errors.state ? 'input-error' : ''}`} value={form.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-base font-semibold">About your work</h2>
          <Field label="Headline" htmlFor="headline" hint="For example: Electrician with 6 years on residential sites">
            <input id="headline" maxLength={150} className="input" value={form.headline ?? ''} onChange={(e) => set('headline', e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="Total experience (years)" htmlFor="years">
              <input
                id="years"
                type="number"
                min={0}
                max={60}
                className="input"
                value={form.totalExperienceYears ?? ''}
                onChange={(e) => set('totalExperienceYears', e.target.value === '' ? null : Math.max(0, Math.min(60, Number(e.target.value))))}
              />
            </Field>
            <Field label="Summary" htmlFor="summary">
              <textarea id="summary" maxLength={2000} className="input min-h-[90px]" value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} placeholder="What work are you best at? What are you looking for?" />
            </Field>
          </div>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-base font-semibold">Skills</h2>
          {meta.data ? (
            <SkillPicker skills={meta.data.skills} selected={form.skillIds} onChange={(ids) => set('skillIds', ids)} />
          ) : meta.error ? (
            <Alert tone="error">{meta.error}</Alert>
          ) : (
            <Spinner label="Loading skills" />
          )}
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Education and training</h2>
            <Button variant="secondary" small onClick={() => set('education', [...form.education, { degree: '', institution: '', yearOfCompletion: null }])}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </div>
          {errors.education && <p className="text-xs font-medium text-red-600" role="alert">{errors.education}</p>}
          {form.education.length === 0 && <p className="text-sm text-slate-500">Add your ITI, diploma, certificate or school details.</p>}
          {form.education.map((e, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_1.4fr_110px_auto]">
              <input className="input" placeholder="Course or certificate, e.g. ITI Electrician" aria-label="Course" value={e.degree} onChange={(ev) => updateEdu(i, { degree: ev.target.value })} />
              <input className="input" placeholder="Institute" aria-label="Institute" value={e.institution ?? ''} onChange={(ev) => updateEdu(i, { institution: ev.target.value })} />
              <input className="input" type="number" placeholder="Year" aria-label="Year of completion" min={1950} max={2100} value={e.yearOfCompletion ?? ''} onChange={(ev) => updateEdu(i, { yearOfCompletion: ev.target.value ? Number(ev.target.value) : null })} />
              <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Remove education" onClick={() => set('education', form.education.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>

        <section className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Work experience</h2>
            <Button variant="secondary" small onClick={() => set('experience', [...form.experience, { jobTitle: '', companyName: '', startDate: '', endDate: '', description: '' }])}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </Button>
          </div>
          {errors.experience && <p className="text-xs font-medium text-red-600" role="alert">{errors.experience}</p>}
          {form.experience.length === 0 && <p className="text-sm text-slate-500">Freshers can skip this or add an apprenticeship.</p>}
          {form.experience.map((x, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Job title" aria-label="Job title" value={x.jobTitle} onChange={(ev) => updateExp(i, { jobTitle: ev.target.value })} />
                <input className="input" placeholder="Company" aria-label="Company" value={x.companyName ?? ''} onChange={(ev) => updateExp(i, { companyName: ev.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Start date" htmlFor={`start-${i}`}>
                  <input id={`start-${i}`} type="date" className="input" value={x.startDate ?? ''} onChange={(ev) => updateExp(i, { startDate: ev.target.value })} />
                </Field>
                <Field label="End date" htmlFor={`end-${i}`} hint="Leave empty if you still work here">
                  <input id={`end-${i}`} type="date" className="input" value={x.endDate ?? ''} onChange={(ev) => updateExp(i, { endDate: ev.target.value })} />
                </Field>
              </div>
              <textarea className="input min-h-[70px]" placeholder="What did you do there?" aria-label="Description" maxLength={2000} value={x.description ?? ''} onChange={(ev) => updateExp(i, { description: ev.target.value })} />
              <div className="text-right">
                <button type="button" className="text-sm font-medium text-red-700 hover:underline" onClick={() => set('experience', form.experience.filter((_, idx) => idx !== i))}>
                  Remove this job
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="card p-5">
          <h2 className="text-base font-semibold">Resume</h2>
          <p className="mt-1 text-sm text-slate-600">PDF, DOC or DOCX, up to 5 MB. Your latest upload is sent with new applications.</p>
          {p.resume ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-brand-600" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.resume.filename}</p>
                  <p className="text-xs text-slate-500">{fileSize(p.resume.sizeBytes)}, uploaded {formatDate(p.resume.uploadedAt)}</p>
                </div>
              </div>
              <Button variant="secondary" small onClick={() => openResume(p.resume!.id, p.resume!.filename).catch((e) => toast.error(errorMessage(e)))}>View</Button>
            </div>
          ) : (
            <Alert tone="warning" className="mt-4">You have not uploaded a resume. Employers respond more often to applications that include one.</Alert>
          )}
          {resumeError && <Alert tone="error" className="mt-3">{resumeError}</Alert>}
          <div className="mt-4">
            <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="sr-only" id="resume-file" onChange={(e) => upload(e.target.files?.[0])} />
            <Button variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden /> {p.resume ? 'Replace resume' : 'Upload resume'}
            </Button>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>Save profile</Button>
        </div>
      </div>
    </>
  );
}
