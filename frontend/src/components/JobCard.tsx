import { Link } from 'react-router-dom';
import { Briefcase, Clock, MapPin, Users } from 'lucide-react';
import type { JobSummary } from '../lib/types';
import { experienceLabel, jobTypeLabel, salaryRange, timeAgo } from '../lib/format';

export function JobCard({ job, footer }: { job: JobSummary; footer?: React.ReactNode }) {
  const salary = salaryRange(job.salaryMin, job.salaryMax);
  return (
    <article className="card relative flex flex-col p-5 transition-colors hover:border-brand-400">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug">
            <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0 hover:text-brand-700 focus-visible:outline-none">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">{job.companyName}</p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
        <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" aria-hidden />{job.city}, {job.state}</li>
        <li className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-slate-400" aria-hidden />{jobTypeLabel[job.jobType]}</li>
        <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" aria-hidden />{experienceLabel(job.minExperienceYears)}</li>
        <li className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" aria-hidden />{job.openings} {job.openings === 1 ? 'opening' : 'openings'}</li>
      </ul>

      {salary && <p className="mt-3 text-[15px] font-semibold text-brand-800">{salary}</p>}

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
          {job.skills.length > 3 && <span className="chip">+{job.skills.length - 3}</span>}
        </div>
      )}

      <div className="relative z-10 mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <span>Posted {timeAgo(job.postedAt ?? job.createdAt).toLowerCase()}</span>
        {footer}
      </div>
    </article>
  );
}
