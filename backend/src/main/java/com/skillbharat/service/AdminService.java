package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.Role;
import com.skillbharat.domain.User;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.CompanyRepository;
import com.skillbharat.repository.JobRepository;
import com.skillbharat.repository.UserRepository;
import com.skillbharat.security.AuthUser;
import com.skillbharat.web.dto.AdminDtos.CompanyView;
import com.skillbharat.web.dto.AdminDtos.DashboardStats;
import com.skillbharat.web.dto.AdminDtos.UserView;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationRow;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

/** Platform oversight. Every state-changing action writes an audit entry in the same transaction. */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository users;
    private final CompanyRepository companies;
    private final JobRepository jobs;
    private final ApplicationRepository applications;
    private final AuditService audit;

    // ---------------------------------------------------------------- dashboard

    @Transactional(readOnly = true)
    public DashboardStats dashboard() {
        Map<ApplicationStatus, Long> byStatus = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s, 0L);
        }
        long totalApplications = 0;
        for (Object[] row : applications.countGroupedByStatus()) {
            byStatus.put((ApplicationStatus) row[0], (Long) row[1]);
            totalApplications += (Long) row[1];
        }
        return new DashboardStats(
                users.countByRole(Role.JOB_SEEKER),
                users.countByRole(Role.EMPLOYER),
                companies.countByStatus(CompanyStatus.PENDING),
                jobs.count(),
                jobs.countByStatus(JobStatus.PENDING_APPROVAL),
                jobs.countByStatusAndActive(JobStatus.APPROVED, true),
                totalApplications,
                byStatus);
    }

    // ---------------------------------------------------------------- users

    @Transactional(readOnly = true)
    public PageResponse<UserView> users(Role role, String q, int page, int size) {
        Pageable pageable = page(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return PageResponse.of(users.findAll(Specs.users(role, q), pageable).map(Mappers::user));
    }

    @Transactional
    public UserView setUserActive(AuthUser actor, Long userId, boolean active) {
        if (actor.id().equals(userId)) {
            throw ApiException.badRequest("You cannot change the status of your own account");
        }
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        user.setActive(active);
        audit.record(actor, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER", user.getId(),
                user.getRole() + " " + user.getEmail());
        return Mappers.user(user);
    }

    // ---------------------------------------------------------------- employers

    @Transactional(readOnly = true)
    public PageResponse<CompanyView> employers(CompanyStatus status, String q, int page, int size) {
        Pageable pageable = page(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var result = companies.findAll(Specs.companies(status, q), pageable);
        Map<Long, Long> jobCounts = jobCounts(result.getContent().stream().map(Company::getId).toList());
        return PageResponse.of(result.map(c -> companyView(c, jobCounts.getOrDefault(c.getId(), 0L))));
    }

    @Transactional
    public CompanyView approveEmployer(AuthUser actor, Long companyId) {
        Company c = company(companyId);
        if (c.getStatus() == CompanyStatus.APPROVED) {
            throw ApiException.conflict("This employer is already approved");
        }
        c.setStatus(CompanyStatus.APPROVED);
        c.setRejectionReason(null);
        c.setReviewedAt(Instant.now());
        audit.record(actor, "EMPLOYER_APPROVED", "COMPANY", c.getId(), c.getName());
        return companyView(c, jobs.countByCompanyId(c.getId()));
    }

    @Transactional
    public CompanyView rejectEmployer(AuthUser actor, Long companyId, String reason) {
        Company c = company(companyId);
        if (c.getStatus() == CompanyStatus.REJECTED) {
            throw ApiException.conflict("This employer is already rejected");
        }
        c.setStatus(CompanyStatus.REJECTED);
        c.setRejectionReason(reason.trim());
        c.setReviewedAt(Instant.now());
        audit.record(actor, "EMPLOYER_REJECTED", "COMPANY", c.getId(), c.getName() + ": " + reason.trim());
        return companyView(c, jobs.countByCompanyId(c.getId()));
    }

    // ---------------------------------------------------------------- jobs

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> jobs(JobStatus status, String q, int page, int size) {
        Pageable pageable = page(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var result = jobs.findAll(Specs.adminJobs(status, q), pageable);
        Map<Long, Long> counts = applicationCounts(result.getContent().stream().map(Job::getId).toList());
        return PageResponse.of(result.map(j -> Mappers.jobSummary(j, counts.getOrDefault(j.getId(), 0L), true)));
    }

    @Transactional(readOnly = true)
    public JobDetail job(Long jobId) {
        return Mappers.jobDetail(jobEntity(jobId), true, null);
    }

    @Transactional
    public JobDetail approveJob(AuthUser actor, Long jobId) {
        Job job = jobEntity(jobId);
        requirePending(job);
        job.setStatus(JobStatus.APPROVED);
        job.setActive(true);
        job.setRejectionReason(null);
        job.setPostedAt(Instant.now());
        job.setUpdatedAt(Instant.now());
        audit.record(actor, "JOB_APPROVED", "JOB", job.getId(), job.getTitle());
        return Mappers.jobDetail(job, true, null);
    }

    @Transactional
    public JobDetail rejectJob(AuthUser actor, Long jobId, String reason) {
        Job job = jobEntity(jobId);
        requirePending(job);
        job.setStatus(JobStatus.REJECTED);
        job.setRejectionReason(reason.trim());
        job.setUpdatedAt(Instant.now());
        audit.record(actor, "JOB_REJECTED", "JOB", job.getId(), job.getTitle() + ": " + reason.trim());
        return Mappers.jobDetail(job, true, null);
    }

    @Transactional
    public JobDetail setJobActive(AuthUser actor, Long jobId, boolean active) {
        Job job = jobEntity(jobId);
        job.setActive(active);
        job.setUpdatedAt(Instant.now());
        audit.record(actor, active ? "JOB_ACTIVATED" : "JOB_DEACTIVATED", "JOB", job.getId(), job.getTitle());
        return Mappers.jobDetail(job, true, null);
    }

    // ---------------------------------------------------------------- applications

    @Transactional(readOnly = true)
    public PageResponse<ApplicationRow> applications(ApplicationStatus status, int page, int size) {
        Pageable pageable = page(page, size, Sort.by(Sort.Direction.DESC, "appliedAt", "id"));
        return PageResponse.of(applications.findAll(Specs.applications(null, null, status), pageable)
                .map(ApplicationMapper::row));
    }

    // ---------------------------------------------------------------- helpers

    private static void requirePending(Job job) {
        if (job.getStatus() != JobStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only jobs waiting for approval can be approved or rejected");
        }
    }

    private Company company(Long id) {
        return companies.findById(id).orElseThrow(() -> ApiException.notFound("Employer not found"));
    }

    private Job jobEntity(Long id) {
        return jobs.findById(id).orElseThrow(() -> ApiException.notFound("Job not found"));
    }

    private static CompanyView companyView(Company c, long jobCount) {
        User o = c.getOwner();
        return new CompanyView(c.getId(), c.getName(), c.getDescription(), c.getIndustry(), c.getCity(),
                c.getState(), c.getWebsite(), c.getStatus(), c.getRejectionReason(), o.getId(), o.getFullName(),
                o.getEmail(), o.isActive(), jobCount, c.getCreatedAt(), c.getReviewedAt());
    }

    private Map<Long, Long> jobCounts(Collection<Long> companyIds) {
        if (companyIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : jobs.countGroupedByCompany(companyIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private Map<Long, Long> applicationCounts(Collection<Long> jobIds) {
        if (jobIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : applications.countGroupedByJob(jobIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private static Pageable page(int page, int size, Sort sort) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort);
    }
}
