import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users as UsersIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { AdminUser, PageResponse, Role } from '../../lib/types';
import { formatDate, roleLabel } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { Badge } from '../../components/StatusBadge';

const roles: (Role | '')[] = ['', 'JOB_SEEKER', 'EMPLOYER', 'ADMIN'];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '0') || 0;
  const [search, setSearch] = useState(q);

  const list = useAsync(() => api.get<PageResponse<AdminUser>>('/admin/users', { role, q, page, size: 20 }), [role, q, page]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const toggle = async (u: AdminUser) => {
    try {
      await api.patch(`/admin/users/${u.id}/active`, { active: !u.active });
      toast.success(u.active ? `${u.fullName} deactivated` : `${u.fullName} activated`);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Job seekers, employers and admins. Deactivated users are signed out immediately." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by role">
          {roles.map((r) => (
            <button
              key={r || 'all'}
              role="tab"
              aria-selected={role === r}
              onClick={() => update({ role: r })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${role === r ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-400'}`}
            >
              {r ? roleLabel[r] : 'All'}
            </button>
          ))}
        </div>
        <form className="relative ml-auto w-full sm:w-72" onSubmit={(e: FormEvent) => { e.preventDefault(); update({ q: search.trim() }); }} role="search">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input className="input pl-9" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        </form>
      </div>

      {list.loading && !list.data ? (
        <Spinner />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : (list.data?.items ?? []).length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" aria-hidden />} title="No users found" description="Try another role or search." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Joined</th><th>Last sign-in</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {list.data!.items.map((u) => (
                  <tr key={u.id}>
                    <td><p className="font-medium">{u.fullName}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                    <td>{roleLabel[u.role]}</td>
                    <td className="whitespace-nowrap">{u.phone ?? ''}</td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</td>
                    <td className="whitespace-nowrap text-slate-600">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                    <td>{u.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
                    <td className="text-right">
                      <Button variant={u.active ? 'danger' : 'success'} small disabled={u.id === me?.id} onClick={() => toggle(u)}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={list.data!.page} totalPages={list.data!.totalPages} onPage={(p) => update({ page: p > 0 ? String(p) : '' })} />
        </>
      )}
    </>
  );
}
