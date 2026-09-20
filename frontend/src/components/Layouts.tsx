import { useState, type ComponentType } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { HardHat, LogOut, Menu, X } from 'lucide-react';
import { homePath, useAuth } from '../context/AuthContext';
import { roleLabel } from '../lib/format';
import type { Role } from '../lib/types';
import { Spinner } from './ui';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`grid h-9 w-9 place-items-center rounded-[10px] ${light ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'}`}>
        <HardHat className="h-5 w-5" aria-hidden />
      </span>
      <span className={`text-lg font-semibold tracking-tight ${light ? 'text-white' : 'text-brand-800'}`}>SkillBharat</span>
    </span>
  );
}

// ---------------------------------------------------------------- public shell

export function PublicLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = (
    <>
      <NavLink to="/jobs" onClick={close} className={({ isActive }) => navClass(isActive)}>Find jobs</NavLink>
      {(!user || user.role === 'EMPLOYER') && (
        <NavLink to={user ? '/employer' : '/register?role=employer'} onClick={close} className={({ isActive }) => navClass(isActive)}>
          For employers
        </NavLink>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" aria-label="SkillBharat home"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">{links}</nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link to={homePath(user.role)} className="btn btn-secondary btn-sm">My {roleLabel[user.role].toLowerCase()} area</Link>
                <button onClick={logout} className="btn btn-ghost btn-sm"><LogOut className="h-4 w-4" aria-hidden /> Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
              </>
            )}
          </div>
          <button className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">{links}</div>
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <Link to={homePath(user.role)} onClick={close} className="btn btn-secondary btn-sm flex-1">My area</Link>
                  <button onClick={() => { close(); logout(); }} className="btn btn-ghost btn-sm">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={close} className="btn btn-secondary btn-sm flex-1">Sign in</Link>
                  <Link to="/register" onClick={close} className="btn btn-primary btn-sm flex-1">Create account</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-brand-900 text-brand-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-3 max-w-xs text-sm text-brand-200">Skilled Hands. Stronger India. Hiring for the trades that build the country.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Job seekers</p>
            <ul className="mt-2 space-y-1.5 text-brand-200">
              <li><Link className="hover:text-white" to="/jobs">Browse jobs</Link></li>
              <li><Link className="hover:text-white" to="/register">Create a profile</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Employers</p>
            <ul className="mt-2 space-y-1.5 text-brand-200">
              <li><Link className="hover:text-white" to="/register?role=employer">Register your company</Link></li>
              <li><Link className="hover:text-white" to="/login">Employer sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-brand-300">© {new Date().getFullYear()} SkillBharat. Made in India.</div>
      </footer>
    </div>
  );
}

function navClass(active: boolean): string {
  return `rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-brand-100 text-brand-800' : 'text-slate-700 hover:bg-slate-100'}`;
}

// ---------------------------------------------------------------- signed-in shell

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

export function DashboardLayout({ items }: { items: NavItem[] }) {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-brand-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="SkillBharat home"><Logo /></Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user ? roleLabel[user.role] : ''}</p>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm"><LogOut className="h-4 w-4" aria-hidden /> Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1" aria-label="Sections">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => sideClass(isActive)}>
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <nav className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="Sections">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700'
                  }`
                }
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function sideClass(active: boolean): string {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
    active ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-white hover:text-brand-700'
  }`;
}

// ---------------------------------------------------------------- route guard

/** Client-side convenience only. The server enforces every permission independently. */
export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homePath(user.role)} replace />;
  return <Outlet />;
}
