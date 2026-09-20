import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { homePath, useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS, SHOW_DEMO_LOGINS } from '../lib/constants';
import { errorMessage } from '../hooks/useAsync';
import { Alert, Button, Field } from '../components/ui';
import { Logo } from '../components/Layouts';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from ?? homePath(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const signedIn = await login(email.trim(), password);
      const allowed = from && (from.startsWith('/jobs') || from.startsWith(homePath(signedIn.role)));
      const target = allowed ? from : homePath(signedIn.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12">
      <div className="w-full">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card p-6">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Welcome back. Use the email you registered with.</p>

          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {error && <Alert tone="error">{error}</Alert>}
            <Field label="Email" htmlFor="email">
              <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="password">
              <input id="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" className="w-full" loading={busy} disabled={!email || !password}>Sign in</Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            New to SkillBharat? <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
          </p>
        </div>

        {SHOW_DEMO_LOGINS && (
          <div className="mt-4 rounded-xl border border-dashed border-brand-300 bg-white p-4">
            <p className="text-sm font-semibold">Try a demo account</p>
            <p className="mt-0.5 text-xs text-slate-500">Fills the form with seeded demo credentials.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.label} type="button" className="btn btn-secondary btn-sm" onClick={() => { setEmail(a.email); setPassword(a.password); }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
