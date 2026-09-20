import { Link } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { EmployerDashboard, JobDetail, JobSummary } from '../../lib/types';
import { formatDate } from '../../lib/format';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { Alert, Button, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui';
import { JobBadge } from '../../components/StatusBadge';

export default function EmployerJobs() {
  const toast = useToast();
  const jobs = useAsync(() => api.get<JobSummary[]>('/employer/jobs'), []);
  const dash = useAsync(() => api.get<EmployerDashboard>('/employer/dashboard'), []);

  const submit = async (id: number) => {
    try {
      await api.post<JobDetail>(`/employer/jobs/${id}/submit`);
      toast.success('Submitted. An admin will review it soon.');
      jobs.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const approved = dash.data?.companyStatus === 'APPROVED';

  return (
    <>
      <PageHeader
        title="My jobs"
        subtitle="Create a job, submit it for approval, and it goes live for job seekers."
        actions={approved ? <Link to="/employer/jobs/new" className="btn btn-primary">Post a job</Link> : undefined}
      />

      {dash.data && !approved && (
        <Alert tone="warning" title="You can post jobs once your company is approved" className="mb-5">
          <Link to="/employer/company" className="font-semibold underline">Check your company status</Link>
        </Alert>
      )}

      {jobs.loading ? (
        <Spinner />
      ) : jobs.error ? (
        <ErrorState message={jobs.error} onRetry={jobs.reload} />
      ) : (jobs.data ?? []).length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="h-6 w-6" aria-hidden />}
          title="No jobs yet"
          description="Post your first job to start receiving applications."
          action={approved ? <Link to="/employer/jobs/new" className="btn btn-primary">Post a job</Link> : undefined}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Job</th><th>Status</th><th>Applicants</th><th>Created</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {jobs.data!.map((j) => (
                <tr key={j.id}>
                  <td>
                    <p className="font-medium">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.city}, {j.state}</p>
                    {j.status === 'REJECTED' && j.rejectionReason && (
                      <p className="mt-1 max-w-xs text-xs text-red-700">Reason: {j.rejectionReason}</p>
                    )}
                  </td>
                  <td><JobBadge status={j.status} active={j.active} /></td>
                  <td className="tabular-nums">
                    {j.applicationCount ? <Link className="font-medium text-brand-700 hover:underline" to={`/employer/applications?jobId=${j.id}`}>{j.applicationCount}</Link> : 0}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{formatDate(j.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link to={`/employer/jobs/${j.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                      {j.status === 'DRAFT' && <Button small onClick={() => submit(j.id)}>Submit for approval</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
