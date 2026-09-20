import { Navigate, Route, Routes } from 'react-router-dom';
import {
  BriefcaseBusiness, Building2, Bookmark, ClipboardList, FileText, LayoutDashboard, ScrollText, ShieldCheck, UserRound, Users,
} from 'lucide-react';
import { DashboardLayout, PublicLayout, RequireRole, type NavItem } from './components/Layouts';

import Landing from './pages/Landing';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import MyApplications from './pages/candidate/Applications';
import SavedJobs from './pages/candidate/SavedJobs';

import EmployerDashboard from './pages/employer/Dashboard';
import EmployerCompany from './pages/employer/Company';
import EmployerJobs from './pages/employer/Jobs';
import JobForm from './pages/employer/JobForm';
import EmployerApplications from './pages/employer/Applications';
import ApplicationReview from './pages/employer/ApplicationReview';

import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployers from './pages/admin/Employers';
import AdminJobs from './pages/admin/Jobs';
import AdminUsers from './pages/admin/Users';
import AdminApplications from './pages/admin/Applications';
import AdminAuditLog from './pages/admin/AuditLog';

const candidateNav: NavItem[] = [
  { to: '/candidate', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/candidate/profile', label: 'My profile', icon: UserRound },
  { to: '/candidate/applications', label: 'Applications', icon: FileText },
  { to: '/candidate/saved', label: 'Saved jobs', icon: Bookmark },
];

const employerNav: NavItem[] = [
  { to: '/employer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/employer/company', label: 'Company', icon: Building2 },
  { to: '/employer/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/employer/applications', label: 'Applications', icon: Users },
];

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/employers', label: 'Employers', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { to: '/admin/users', label: 'Users', icon: ShieldCheck },
  { to: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { to: '/admin/audit', label: 'Activity log', icon: ScrollText },
];

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      <Route path="candidate" element={<RequireRole role="JOB_SEEKER" />}>
        <Route element={<DashboardLayout items={candidateNav} />}>
          <Route index element={<CandidateDashboard />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="saved" element={<SavedJobs />} />
        </Route>
      </Route>

      <Route path="employer" element={<RequireRole role="EMPLOYER" />}>
        <Route element={<DashboardLayout items={employerNav} />}>
          <Route index element={<EmployerDashboard />} />
          <Route path="company" element={<EmployerCompany />} />
          <Route path="jobs" element={<EmployerJobs />} />
          <Route path="jobs/new" element={<JobForm />} />
          <Route path="jobs/:id/edit" element={<JobForm />} />
          <Route path="applications" element={<EmployerApplications />} />
          <Route path="applications/:id" element={<ApplicationReview />} />
        </Route>
      </Route>

      <Route path="admin" element={<RequireRole role="ADMIN" />}>
        <Route element={<DashboardLayout items={adminNav} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="employers" element={<AdminEmployers />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="audit" element={<AdminAuditLog />} />
        </Route>
      </Route>

      <Route path="home" element={<Navigate to="/" replace />} />
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
