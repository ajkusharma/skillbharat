import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { SavedJob } from '../../lib/types';
import { errorMessage, useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, PageHeader, SkeletonList } from '../../components/ui';
import { JobCard } from '../../components/JobCard';

export default function SavedJobs() {
  const saved = useAsync(() => api.get<SavedJob[]>('/candidate/saved-jobs'), []);
  const toast = useToast();

  const remove = async (jobId: number) => {
    try {
      await api.del(`/candidate/saved-jobs/${jobId}`);
      toast.success('Removed from saved jobs');
      saved.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Saved jobs" subtitle="Jobs you bookmarked to come back to." />
      {saved.loading ? (
        <SkeletonList rows={2} />
      ) : saved.error ? (
        <ErrorState message={saved.error} onRetry={saved.reload} />
      ) : (saved.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" aria-hidden />}
          title="No saved jobs"
          description="Tap Save job on any listing and it will be kept here."
          action={<Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {saved.data!.map((s) => (
            <JobCard
              key={s.jobId}
              job={s.job}
              footer={<button className="font-medium text-red-700 hover:underline" onClick={() => remove(s.jobId)}>Remove</button>}
            />
          ))}
        </div>
      )}
    </>
  );
}
