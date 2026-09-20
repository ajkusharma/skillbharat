import type { ApplicationStatus, CompanyStatus, JobStatus } from '../lib/types';
import { applicationStatusLabel, companyStatusLabel, jobStatusLabel } from '../lib/format';

const tones = {
  blue: 'bg-brand-100 text-brand-800',
  green: 'bg-success-soft text-success-ink',
  amber: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-800',
  slate: 'bg-slate-100 text-slate-700',
} as const;

export function Badge({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  const tone = status === 'SHORTLISTED' ? 'green' : status === 'REJECTED' ? 'red' : 'blue';
  return <Badge tone={tone}>{applicationStatusLabel[status]}</Badge>;
}

export function JobBadge({ status, active = true }: { status: JobStatus; active?: boolean }) {
  if (status === 'APPROVED' && !active) return <Badge tone="slate">Switched off</Badge>;
  const tone = status === 'APPROVED' ? 'green' : status === 'PENDING_APPROVAL' ? 'amber' : status === 'REJECTED' ? 'red' : 'slate';
  return <Badge tone={tone}>{jobStatusLabel[status]}</Badge>;
}

export function CompanyBadge({ status }: { status: CompanyStatus }) {
  const tone = status === 'APPROVED' ? 'green' : status === 'PENDING' ? 'amber' : 'red';
  return <Badge tone={tone}>{companyStatusLabel[status]}</Badge>;
}
