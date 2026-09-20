import type { ApplicationStatus, CompanyStatus, JobStatus, JobType } from './types';

const inr = new Intl.NumberFormat('en-IN');

export const rupees = (amount: number): string => `₹${inr.format(amount)}`;

export function salaryRange(min?: number | null, max?: number | null): string | null {
  if (min && max) return `${rupees(min)} – ${rupees(max)} / month`;
  if (max) return `Up to ${rupees(max)} / month`;
  if (min) return `From ${rupees(min)} / month`;
  return null;
}

/** 19 Sep 2026 */
export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** 19 Sep 2026, 4:30 pm */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const jobTypeLabel: Record<JobType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  APPRENTICE: 'Apprenticeship',
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
};

export const jobStatusLabel: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Awaiting approval',
  APPROVED: 'Live',
  REJECTED: 'Rejected',
};

export const companyStatusLabel: Record<CompanyStatus, string> = {
  PENDING: 'Awaiting approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const roleLabel = { JOB_SEEKER: 'Job seeker', EMPLOYER: 'Employer', ADMIN: 'Admin' } as const;

export function experienceLabel(years: number): string {
  if (years <= 0) return 'Freshers welcome';
  return years === 1 ? '1+ year' : `${years}+ years`;
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
}
