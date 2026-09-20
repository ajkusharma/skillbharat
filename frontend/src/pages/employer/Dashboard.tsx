import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { EmployerDashboard as Dash } from '../../lib/types';
import { useAsync } from '../../hooks/useAsync';
import { Alert, ErrorState, PageHeader, Spinner, StatCard } from '../../components/ui';
import { CompanyBadge } from '../../components/StatusBadge';

export default function EmployerDashboard() {
  const dash = useAsync(() => api.get<Dash>('/employer/dashboard'), []);

  if (dash.loading) return <Spinner />;
  if (dash.error || !dash.data) return <ErrorState message={dash.error ?? 'Could not load'} onRetry={dash.reload} />;
  const d = dash.data;
  const approved = d.companyStatus === 'APPROVED';

  return (
    <>
      <PageHeader
        title={d.companyName}
        subtitle="Your hiring at a glance."
        actions={approved ? <Link to="/employer/jobs/new" className="btn btn-primary">Post a job</Link> : undefined}
      />

      <div className="mb-6 flex items-center gap-2 text-sm text-slate-600">Company status: <CompanyBadge status={d.companyStatus} /></div>

      {d.companyStatus === 'PENDING' && (
        <Alert tone="warning" title="Your company is waiting for approval" className="mb-6">
          Our team verifies every employer before jobs can be posted. Complete your <Link to="/employer/company" className="font-semibold underline">company profile</Link> to speed this up.
        </Alert>
      )}
      {d.companyStatus === 'REJECTED' && (
        <Alert tone="error" title="Your company was not approved" className="mb-6">
          See the reason on your <Link to="/employer/company" className="font-semibold underline">company profile</Link>, update the details and it will be reviewed again.
        </Alert>
      )}

      <h2 className="mb-3 text-base font-semibold">Jobs</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live" value={d.approvedJobs} tone={d.approvedJobs > 0 ? 'good' : 'default'} />
        <StatCard label="Awaiting approval" value={d.pendingJobs} tone={d.pendingJobs > 0 ? 'warn' : 'default'} />
        <StatCard label="Drafts" value={d.draftJobs} />
        <StatCard label="Rejected" value={d.rejectedJobs} />
      </div>

      <h2 className="mb-3 mt-8 text-base font-semibold">Applications</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total received" value={d.totalApplications} />
        <StatCard label="New, to review" value={d.newApplications} tone={d.newApplications > 0 ? 'warn' : 'default'} />
        <StatCard label="Shortlisted" value={d.shortlisted} tone={d.shortlisted > 0 ? 'good' : 'default'} />
        <StatCard label="Rejected" value={d.rejectedApplications} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/employer/applications" className="btn btn-primary">Review applications</Link>
        <Link to="/employer/jobs" className="btn btn-secondary">Manage jobs</Link>
      </div>
    </>
  );
}
