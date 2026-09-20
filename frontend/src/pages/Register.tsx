import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { HardHat, Building2 } from 'lucide-react';
import { homePath, useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { CITIES, STATES, stateForCity } from '../lib/constants';
import { Alert, Button, Field } from '../components/ui';
import { Logo } from '../components/Layouts';

const PHONE = /^[6-9][0-9]{9}$/;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$/;

type Kind = 'candidate' | 'employer';

export default function Register() {
  const { user, registerCandidate, registerEmployer } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind: Kind = params.get('role') === 'employer' ? 'employer' : 'candidate';

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', companyName: '', city: '', state: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePath(user.role)} replace />;

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!PHONE.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!PASSWORD.test(form.password)) e.password = 'Use 8 or more characters with at least one letter and one number';
    if (kind === 'employer') {
      if (!form.companyName.trim()) e.companyName = 'Enter your company name';
      if (!form.city.trim()) e.city = 'Enter the city';
      if (!form.state.trim()) e.state = 'Choose the state';
    }
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const base = { fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone, password: form.password };
      const created = kind === 'employer'
        ? await registerEmployer({ ...base, companyName: form.companyName.trim(), city: form.city.trim(), state: form.state })
        : await registerCandidate(base);
      navigate(created.role === 'EMPLOYER' ? '/employer/company' : '/candidate/profile', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex justify-center"><Logo /></div>
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Create your account</h1>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Account type">
          <TabButton active={kind === 'candidate'} onClick={() => setParams({})} icon={<HardHat className="h-4 w-4" />} label="I am looking for work" />
          <TabButton active={kind === 'employer'} onClick={() => setParams({ role: 'employer' })} icon={<Building2 className="h-4 w-4" />} label="I want to hire" />
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          {formError && <Alert tone="error">{formError}</Alert>}

          <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
            <input id="fullName" className={`input ${errors.fullName ? 'input-error' : ''}`} autoComplete="name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" error={errors.email}>
              <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="10 digits, without +91">
              <input id="phone" inputMode="numeric" maxLength={10} className={`input ${errors.phone ? 'input-error' : ''}`} autoComplete="tel-national" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} />
            </Field>
          </div>

          {kind === 'employer' && (
            <>
              <Field label="Company name" htmlFor="companyName" error={errors.companyName}>
                <input id="companyName" className={`input ${errors.companyName ? 'input-error' : ''}`} autoComplete="organization" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="city" error={errors.city}>
                  <input
                    id="city"
                    list="city-options"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                    value={form.city}
                    onChange={(e) => {
                      const city = e.target.value;
                      set('city', city);
                      const guess = stateForCity(city);
                      if (guess) set('state', guess);
                    }}
                  />
                  <datalist id="city-options">{CITIES.map((c) => <option key={c.city} value={c.city} />)}</datalist>
                </Field>
                <Field label="State" htmlFor="state" error={errors.state}>
                  <select id="state" className={`input ${errors.state ? 'input-error' : ''}`} value={form.state} onChange={(e) => set('state', e.target.value)}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Alert tone="info">New employers are verified by our team before they can post jobs. This usually takes one working day.</Alert>
            </>
          )}

          <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters, with a letter and a number">
            <input id="password" type="password" autoComplete="new-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>

          <Button type="submit" className="w-full" loading={busy}>
            {kind === 'employer' ? 'Register company' : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-white text-brand-800 shadow-sm' : 'text-slate-600 hover:text-ink'}`}
    >
      {icon} {label}
    </button>
  );
}
