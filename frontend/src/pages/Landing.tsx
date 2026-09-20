import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Cog, Droplets, Flame, Hammer, Monitor, Scissors, Search, ShieldCheck, Snowflake, Sparkles, Store,
  Truck, Wrench, Zap, ChefHat, BrickWall,
} from 'lucide-react';
import { api } from '../lib/api';
import { CITIES } from '../lib/constants';
import type { JobSummary, PageResponse, PublicMeta } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { JobCard } from '../components/JobCard';
import { ErrorState, SkeletonList } from '../components/ui';

const tradeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Electrical & Electronics': Zap,
  'Plumbing & Sanitation': Droplets,
  'Welding & Fabrication': Flame,
  'Carpentry & Furniture': Hammer,
  'Construction & Civil': BrickWall,
  'Automotive & Mechanic': Wrench,
  'CNC & Machine Operation': Cog,
  'HVAC & Refrigeration': Snowflake,
  'Driving & Logistics': Truck,
  'Hospitality & Kitchen': ChefHat,
  'Security & Facility': ShieldCheck,
  'Tailoring & Textile': Scissors,
  'Beauty & Wellness': Sparkles,
  'Retail & Sales': Store,
  'Office & IT Support': Monitor,
};

const popular = ['Electrician', 'Welder', 'CNC Operator', 'Driver', 'Mechanic', 'Mason'];

export default function Landing() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');

  const meta = useAsync(() => api.get<PublicMeta>('/public/meta'), []);
  const latest = useAsync(() => api.get<PageResponse<JobSummary>>('/public/jobs', { size: 6 }), []);

  const search = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city) params.set('city', city);
    navigate(`/jobs?${params.toString()}`);
  };

  const stats = meta.data?.stats;

  return (
    <>
      {/* Hero */}
      <section className="bg-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 md:pb-20 md:pt-20">
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl">
            Skilled Hands. Stronger India.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-brand-100">
            Electricians, welders, mechanics, drivers and more. Find work near you, or hire trained people your site can rely on.
          </p>

          <form onSubmit={search} className="mt-8 grid max-w-3xl gap-2 rounded-2xl bg-white p-2.5 shadow-lift md:grid-cols-[1fr_200px_auto]" role="search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
              <input
                className="input border-transparent pl-10 focus:border-brand-500"
                placeholder="Job title or skill, e.g. welder"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Job title or skill"
              />
            </div>
            <select className="input border-transparent" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              <option value="">All India</option>
              {CITIES.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
            </select>
            <button className="btn btn-primary px-6" type="submit">Search jobs</button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-brand-200">Popular:</span>
            {popular.map((p) => (
              <Link key={p} to={`/jobs?keyword=${encodeURIComponent(p)}`} className="rounded-full border border-white/25 px-3 py-1 text-white hover:bg-white/10">
                {p}
              </Link>
            ))}
          </div>

          {stats && (
            <p className="mt-8 text-sm text-brand-200">
              {stats.openJobs.toLocaleString('en-IN')} open jobs from {stats.employers.toLocaleString('en-IN')} verified employers,
              {' '}{stats.candidates.toLocaleString('en-IN')} skilled workers on the platform.
            </p>
          )}
        </div>
        <div className="ruler" aria-hidden />
      </section>

      {/* Trades */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Browse by trade</h2>
            <p className="mt-1 text-sm text-slate-600">Pick your trade to see who is hiring right now.</p>
          </div>
          <Link to="/jobs" className="btn btn-ghost btn-sm hidden sm:inline-flex">All jobs</Link>
        </div>
        {meta.error ? (
          <ErrorState message={meta.error} onRetry={meta.reload} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {(meta.data?.categories ?? Array.from({ length: 10 }, () => null)).map((c, i) => {
              if (!c) return <div key={i} className="card h-24 animate-pulse bg-slate-100" aria-hidden />;
              const Icon = tradeIcons[c.category] ?? Briefcase;
              return (
                <Link
                  key={c.category}
                  to={`/jobs?category=${encodeURIComponent(c.category)}`}
                  className="card group flex flex-col gap-3 p-4 transition-colors hover:border-brand-500 hover:bg-brand-50"
                >
                  <Icon className="h-6 w-6 text-brand-600" />
                  <span>
                    <span className="block text-sm font-semibold leading-snug">{c.category}</span>
                    <span className="text-xs text-slate-500">{c.openJobs} open {c.openJobs === 1 ? 'job' : 'jobs'}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Latest jobs */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Latest jobs</h2>
            <Link to="/jobs" className="btn btn-secondary btn-sm">View all jobs</Link>
          </div>
          {latest.loading ? (
            <SkeletonList rows={3} />
          ) : latest.error ? (
            <ErrorState message={latest.error} onRetry={latest.reload} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {latest.data?.items.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <Steps
            title="For job seekers"
            steps={[
              'Create your profile with your trade, skills and location.',
              'Upload your resume and apply to jobs near you.',
              'Track every application until you hear back.',
            ]}
            cta={<Link to="/register" className="btn btn-primary">Create a free profile</Link>}
          />
          <Steps
            title="For employers"
            steps={[
              'Register your company. We verify every employer.',
              'Post a job and send it for approval.',
              'Review applicants and shortlist the right people.',
            ]}
            cta={<Link to="/register?role=employer" className="btn btn-secondary">Start hiring</Link>}
          />
        </div>
      </section>
    </>
  );
}

function Steps({ title, steps, cta }: { title: string; steps: string[]; cta: React.ReactNode }) {
  return (
    <div className="card flex flex-col p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ol className="mt-4 space-y-4">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">{i + 1}</span>
            <span className="pt-0.5 text-slate-700">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6">{cta}</div>
    </div>
  );
}
