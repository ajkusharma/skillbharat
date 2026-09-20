// Mirrors the backend DTOs (see backend/src/main/java/com/skillbharat/web/dto).

export type Role = 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type JobStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'APPRENTICE';
export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface Skill { id: number; name: string; category: string }

export interface UserInfo { id: number; fullName: string; email: string; role: Role }
export interface AuthResponse { token: string; user: UserInfo }

export interface Education { degree: string; institution?: string | null; yearOfCompletion?: number | null }
export interface Experience {
  jobTitle: string;
  companyName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}
export interface ResumeInfo { id: number; filename: string; sizeBytes: number; uploadedAt: string }

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  headline?: string | null;
  city?: string | null;
  state?: string | null;
  summary?: string | null;
  totalExperienceYears?: number | null;
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  resume?: ResumeInfo | null;
  completeness: number;
}

export interface ProfileRequest {
  fullName: string;
  phone: string;
  headline?: string;
  city: string;
  state: string;
  summary?: string;
  totalExperienceYears?: number | null;
  skillIds: number[];
  education: Education[];
  experience: Experience[];
}

export interface ViewerState { applied: boolean; applicationStatus?: ApplicationStatus | null; saved: boolean }

export interface JobSummary {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  city: string;
  state: string;
  category: string;
  jobType: JobType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  minExperienceYears: number;
  openings: number;
  skills: string[];
  status: JobStatus;
  active: boolean;
  rejectionReason?: string | null;
  applicationCount?: number | null;
  postedAt?: string | null;
  createdAt: string;
}

export interface JobDetail {
  id: number;
  title: string;
  description: string;
  companyId: number;
  companyName: string;
  companyIndustry?: string | null;
  companyDescription?: string | null;
  companyWebsite?: string | null;
  category: string;
  city: string;
  state: string;
  jobType: JobType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  minExperienceYears: number;
  openings: number;
  skills: Skill[];
  status: JobStatus;
  active: boolean;
  rejectionReason?: string | null;
  postedAt?: string | null;
  createdAt: string;
  viewer?: ViewerState | null;
}

export interface JobRequest {
  title: string;
  description: string;
  category: string;
  city: string;
  state: string;
  jobType: JobType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  minExperienceYears: number;
  openings: number;
  skillIds: number[];
}

export interface PublicMeta {
  skills: Skill[];
  categories: { category: string; openJobs: number }[];
  stats: { openJobs: number; employers: number; candidates: number };
}

export interface MyApplication {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverNote?: string | null;
  jobId: number;
  jobTitle: string;
  companyName: string;
  city: string;
  state: string;
  jobStillOpen: boolean;
}

export interface SavedJob { jobId: number; savedAt: string; job: JobSummary }

export interface ApplicationRow {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  jobId: number;
  jobTitle: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  candidateCity?: string | null;
  candidateState?: string | null;
  candidateExperienceYears?: number | null;
  candidateSkills: string[];
  hasResume: boolean;
}

export interface ApplicationDetail {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  coverNote?: string | null;
  jobId: number;
  jobTitle: string;
  resumeId?: number | null;
  resumeFilename?: string | null;
  candidate: Profile;
}

export interface Company {
  id: number;
  name: string;
  description?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  status: CompanyStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface EmployerDashboard {
  companyStatus: CompanyStatus;
  companyName: string;
  totalJobs: number;
  draftJobs: number;
  pendingJobs: number;
  approvedJobs: number;
  rejectedJobs: number;
  totalApplications: number;
  newApplications: number;
  shortlisted: number;
  rejectedApplications: number;
}

export interface AdminDashboard {
  candidates: number;
  employers: number;
  pendingEmployers: number;
  totalJobs: number;
  pendingJobs: number;
  liveJobs: number;
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminCompany {
  id: number;
  name: string;
  description?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  status: CompanyStatus;
  rejectionReason?: string | null;
  ownerId: number;
  ownerName: string;
  ownerEmail: string;
  ownerActive: boolean;
  jobCount: number;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface AuditLogEntry {
  id: number;
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
  createdAt: string;
}
