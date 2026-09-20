import { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { CITIES, STATES, stateForCity } from '../../lib/constants';
import { useToast } from '../../context/ToastContext';
import type { Company } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Alert, Button, ErrorState, Field, PageHeader, Spinner } from '../../components/ui';
import { CompanyBadge } from '../../components/StatusBadge';

interface Form { name: string; industry: string; city: string; state: string; website: string; description: string }

export default function EmployerCompany() {
  const toast = useToast();
  const company = useAsync(() => api.get<Company>('/employer/company'), []);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = company.data;
    if (c) setForm({ name: c.name, industry: c.industry ?? '', city: c.city ?? '', state: c.state ?? '', website: c.website ?? '', description: c.description ?? '' });
  }, [company.data]);

  if (company.loading && !form) return <Spinner />;
  if (company.error && !form) return <ErrorState message={company.error} onRetry={company.reload} />;
  if (!form || !company.data) return null;

  const c = company.data;
  const set = (key: keyof Form, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Enter the company name';
    if (!form.city.trim()) e.city = 'Enter the city';
    if (!form.state.trim()) e.state = 'Choose the state';
    if (form.website && !/^https?:\/\/.+/i.test(form.website)) e.website = 'Start the website with http:// or https://';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await api.put('/employer/company', form);
      toast.success(c.status === 'REJECTED' ? 'Saved. Your company has been sent for review again.' : 'Company profile saved');
      company.reload();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Company profile" subtitle="Job seekers see this on every job you post." actions={<CompanyBadge status={c.status} />} />

      {c.status === 'PENDING' && (
        <Alert tone="warning" title="Waiting for approval" className="mb-5">
          Our team will review your company shortly. You can post jobs as soon as it is approved.
        </Alert>
      )}
      {c.status === 'REJECTED' && (
        <Alert tone="error" title="Not approved" className="mb-5">
          {c.rejectionReason ?? 'Please review your details.'} Update the profile below and save to send it for review again.
        </Alert>
      )}
      {c.status === 'APPROVED' && c.reviewedAt && (
        <Alert tone="success" className="mb-5">Approved on {formatDate(c.reviewedAt)}. You can post jobs.</Alert>
      )}

      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" htmlFor="name" error={errors.name}>
            <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Industry" htmlFor="industry" hint="For example: Electrical contracting">
            <input id="industry" className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <input
              id="city"
              list="company-cities"
              className={`input ${errors.city ? 'input-error' : ''}`}
              value={form.city}
              onChange={(e) => {
                set('city', e.target.value);
                const guess = stateForCity(e.target.value);
                if (guess) set('state', guess);
              }}
            />
            <datalist id="company-cities">{CITIES.map((x) => <option key={x.city} value={x.city} />)}</datalist>
          </Field>
          <Field label="State" htmlFor="state" error={errors.state}>
            <select id="state" className={`input ${errors.state ? 'input-error' : ''}`} value={form.state} onChange={(e) => set('state', e.target.value)}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Website" htmlFor="website" error={errors.website}>
          <input id="website" className={`input ${errors.website ? 'input-error' : ''}`} placeholder="https://" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </Field>
        <Field label="About the company" htmlFor="description" hint="What you do, how many people work with you, and what makes you a good employer">
          <textarea id="description" maxLength={3000} className="input min-h-[120px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="flex justify-end"><Button onClick={save} loading={saving}>Save company profile</Button></div>
      </div>
    </>
  );
}
