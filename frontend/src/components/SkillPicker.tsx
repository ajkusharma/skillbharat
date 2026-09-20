import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Skill } from '../lib/types';

/** Search-and-toggle skill selector, grouped by trade category. */
export function SkillPicker({
  skills, selected, onChange, max = 20,
}: { skills: Skill[]; selected: number[]; onChange: (ids: number[]) => void; max?: number }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => Array.from(new Set(skills.map((s) => s.category))), [skills]);
  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter(
      (s) => (!category || s.category === category) && (!q || s.name.toLowerCase().includes(q)),
    );
  }, [skills, query, category]);

  const toggle = (id: number) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected skills">
          {selected.map((id) => {
            const s = byId.get(id);
            if (!s) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-600 py-1 pl-3 pr-1.5 text-xs font-medium text-white">
                {s.name}
                <button type="button" onClick={() => toggle(id)} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Remove ${s.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search skills, e.g. welding"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search skills"
          />
        </div>
        <select className="input sm:w-56" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter skills by trade">
          <option value="">All trades</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
        {visible.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-500">No skills match your search.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visible.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  aria-pressed={on}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    on ? 'border-brand-600 bg-brand-100 text-brand-800' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">{selected.length} of {max} selected</p>
    </div>
  );
}
