import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { api } from '../lib/api';
import { CITIES } from '../lib/constants';
import type { JobSummary, PageResponse, PublicMeta } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { JobCard } from '../components/JobCard';
import { Button, EmptyState, ErrorState, Pagination, SkeletonList } from '../components/ui';

export default function Jobs() {
  const [params, setParams] = useSearchParams();
  const keywordParam = params.get('keyword') ?? '';
  const city = params.get('city') ?? '';
  const category = params.get('category') ?? '';
  const skillId = params.get('skillId') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;

  const [keyword, setKeyword] = useState(keywordParam);
  useEffect(() => setKeyword(keywordParam), [keywordParam]);

  const meta = useAsync(() => api.get<PublicMeta>('/public/meta'), []);
  const results = useAsync(
    () => api.get<PageResponse<JobSummary>>('/public/jobs', { keyword: keywordParam, city, category, skillId, page, size: 12 }),
    [keywordParam, city, category, skillId, page],
  );

  const skillOptions = useMemo(
    () => (meta.data?.skills ?? []).filter((s) => !category || s.category === category),
    [meta.data, category],
  );

  const update = (changes: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete('page');
    setParams(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    update({ keyword: keyword.trim() });
  };

  const hasFilters = Boolean(keywordParam || city || category || skillId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Find a job</h1>
      <p className="mt-1 text-sm text-slate-600">Search openings from verified employers across India.</p>

      <form onSubmit={submit} className="card mt-5 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input className="input pl-9" placeholder="Job title, skill or company" value={keyword} onChange={(e) => setKeyword(e.target.value)} aria-label="Keyword" />
        </div>
        <select className="input" value={city} onChange={(e) => update({ city: e.target.value })} aria-label="City">
          <option value="">All cities</option>
          {CITIES.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
        </select>
        <select className="input" value={category} onChange={(e) => update({ category: e.target.value, skillId: '' })} aria-label="Trade">
          <option value="">All trades</option>
          {meta.data?.categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
        <select className="input" value={skillId} onChange={(e) => update({ skillId: e.target.value })} aria-label="Skill">
          <option value="">Any skill</option>
          {skillOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-600" aria-live="polite">
          {results.data ? `${results.data.totalItems.toLocaleString('en-IN')} ${results.data.totalItems === 1 ? 'job' : 'jobs'} found` : ' '}
        </p>
        {hasFilters && (
          <button className="text-sm font-medium text-brand-700 hover:underline" onClick={() => setParams(new URLSearchParams())}>
            Clear all filters
          </button>
        )}
      </div>

      <div className="mt-3">
        {results.loading && !results.data ? (
          <SkeletonList rows={4} />
        ) : results.error ? (
          <ErrorState message={results.error} onRetry={results.reload} />
        ) : results.data && results.data.items.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" aria-hidden />}
            title="No jobs match these filters"
            description="Try a different city or trade, or remove a filter. New jobs are added every day."
            action={hasFilters ? <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>Clear filters</Button> : undefined}
          />
        ) : (
          <>
            <div className={`grid gap-4 md:grid-cols-2 ${results.loading ? 'opacity-60' : ''}`}>
              {results.data?.items.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
            <Pagination
              page={results.data?.page ?? 0}
              totalPages={results.data?.totalPages ?? 0}
              onPage={(p) => { update({ page: p > 0 ? String(p) : '' }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
