package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.Application;
import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.CompanyRepository;
import com.skillbharat.repository.JobRepository;
import com.skillbharat.security.AuthUser;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationDetail;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationRow;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.EmployerDtos.CompanyRequest;
import com.skillbharat.web.dto.EmployerDtos.CompanyResponse;
import com.skillbharat.web.dto.EmployerDtos.EmployerDashboard;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobRequest;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Everything an employer does, always scoped to the employer's own company. */
@Service
@RequiredArgsConstructor
public class EmployerService {

    private final CompanyRepository companies;
    private final JobRepository jobs;
    private final ApplicationRepository applications;
    private final SkillService skillService;
    private final CandidateProfileService profileService;
    private final AuditService audit;

    // ---------------------------------------------------------------- company

    @Transactional(readOnly = true)
    public CompanyResponse company(Long userId) {
        return Mappers.company(companyOf(userId));
    }

    @Transactional
    public CompanyResponse updateCompany(Long userId, CompanyRequest req) {
        Company c = companyOf(userId);
        c.setName(req.name().trim());
        c.setDescription(clean(req.description()));
        c.setIndustry(clean(req.industry()));
        c.setCity(req.city().trim());
        c.setState(req.state().trim());
        c.setWebsite(clean(req.website()));
        c.setUpdatedAt(Instant.now());
        if (c.getStatus() == CompanyStatus.REJECTED) {
            // Editing a rejected profile is a resubmission for review.
            c.setStatus(CompanyStatus.PENDING);
            c.setRejectionReason(null);
        }
        return Mappers.company(c);
    }

    @Transactional(readOnly = true)
    public EmployerDashboard dashboard(Long userId) {
        Company c = companyOf(userId);
        Map<ApplicationStatus, Long> byStatus = new HashMap<>();
        for (Object[] row : applications.countGroupedByStatusForCompany(c.getId())) {
            byStatus.put((ApplicationStatus) row[0], (Long) row[1]);
        }
        long applied = byStatus.getOrDefault(ApplicationStatus.APPLIED, 0L);
        long shortlisted = byStatus.getOrDefault(ApplicationStatus.SHORTLISTED, 0L);
        long rejected = byStatus.getOrDefault(ApplicationStatus.REJECTED, 0L);
        return new EmployerDashboard(c.getStatus(), c.getName(),
                jobs.countByCompanyId(c.getId()),
                jobs.countByCompanyIdAndStatus(c.getId(), JobStatus.DRAFT),
                jobs.countByCompanyIdAndStatus(c.getId(), JobStatus.PENDING_APPROVAL),
                jobs.countByCompanyIdAndStatus(c.getId(), JobStatus.APPROVED),
                jobs.countByCompanyIdAndStatus(c.getId(), JobStatus.REJECTED),
                applied + shortlisted + rejected, applied, shortlisted, rejected);
    }

    // ---------------------------------------------------------------- jobs

    @Transactional
    public JobDetail createJob(Long userId, JobRequest req) {
        Company c = companyOf(userId);
        if (c.getStatus() != CompanyStatus.APPROVED) {
            throw ApiException.forbidden("Your company must be approved by SkillBharat before you can post jobs");
        }
        Job job = new Job();
        job.setCompany(c);
        applyRequest(job, req);
        job.setStatus(JobStatus.DRAFT);
        return Mappers.jobDetail(jobs.save(job), true, null);
    }

    @Transactional
    public JobDetail updateJob(Long userId, Long jobId, JobRequest req) {
        Job job = ownedJob(userId, jobId);
        applyRequest(job, req);
        // Any content change to a live or rejected job takes it offline until it is submitted again.
        if (job.getStatus() == JobStatus.APPROVED || job.getStatus() == JobStatus.REJECTED) {
            job.setStatus(JobStatus.DRAFT);
        }
        job.setUpdatedAt(Instant.now());
        return Mappers.jobDetail(job, true, null);
    }

    @Transactional
    public JobDetail submitJob(Long userId, Long jobId) {
        Job job = ownedJob(userId, jobId);
        if (job.getCompany().getStatus() != CompanyStatus.APPROVED) {
            throw ApiException.forbidden("Your company must be approved before you can submit jobs");
        }
        if (job.getStatus() != JobStatus.DRAFT) {
            throw ApiException.badRequest("Only draft jobs can be submitted for approval");
        }
        job.setStatus(JobStatus.PENDING_APPROVAL);
        job.setRejectionReason(null);
        job.setUpdatedAt(Instant.now());
        return Mappers.jobDetail(job, true, null);
    }

    @Transactional(readOnly = true)
    public List<JobSummary> listJobs(Long userId) {
        Company c = companyOf(userId);
        List<Job> mine = jobs.findByCompanyIdOrderByCreatedAtDesc(c.getId());
        Map<Long, Long> counts = applicationCounts(mine.stream().map(Job::getId).toList());
        return mine.stream()
                .map(j -> Mappers.jobSummary(j, counts.getOrDefault(j.getId(), 0L), true))
                .toList();
    }

    @Transactional(readOnly = true)
    public JobDetail getJob(Long userId, Long jobId) {
        return Mappers.jobDetail(ownedJob(userId, jobId), true, null);
    }

    // ---------------------------------------------------------------- applications

    @Transactional(readOnly = true)
    public PageResponse<ApplicationRow> listApplications(Long userId, Long jobId, ApplicationStatus status,
                                                         int page, int size) {
        Company c = companyOf(userId);
        if (jobId != null) {
            ownedJob(userId, jobId);   // 404 if the job belongs to someone else
        }
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "appliedAt", "id"));
        return PageResponse.of(applications
                .findAll(Specs.applications(c.getOwner().getId(), jobId, status), pageable)
                .map(a -> ApplicationMapper.row(a)));
    }

    @Transactional(readOnly = true)
    public ApplicationDetail applicationDetail(Long userId, Long applicationId) {
        Application a = ownedApplication(userId, applicationId);
        return ApplicationMapper.detail(a, profileService.toResponse(a.getCandidate()));
    }

    @Transactional
    public ApplicationDetail decide(AuthUser actor, Long applicationId, ApplicationStatus decision) {
        if (decision != ApplicationStatus.SHORTLISTED && decision != ApplicationStatus.REJECTED) {
            throw ApiException.badRequest("An application can only be shortlisted or rejected");
        }
        Application a = ownedApplication(actor.id(), applicationId);
        a.setStatus(decision);
        a.setUpdatedAt(Instant.now());
        audit.record(actor, "APPLICATION_" + decision.name(), "APPLICATION", a.getId(),
                "Employer " + decision.name().toLowerCase() + " " + a.getCandidate().getUser().getFullName()
                        + " for '" + a.getJob().getTitle() + "'");
        return ApplicationMapper.detail(a, profileService.toResponse(a.getCandidate()));
    }

    // ---------------------------------------------------------------- helpers

    private Company companyOf(Long userId) {
        return companies.findByOwnerId(userId)
                .orElseThrow(() -> ApiException.notFound("Company profile not found"));
    }

    private Job ownedJob(Long userId, Long jobId) {
        return jobs.findById(jobId)
                .filter(j -> j.getCompany().getOwner().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Job not found"));
    }

    private Application ownedApplication(Long userId, Long applicationId) {
        return applications.findById(applicationId)
                .filter(a -> a.getJob().getCompany().getOwner().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Application not found"));
    }

    private void applyRequest(Job job, JobRequest req) {
        skillService.requireCategory(req.category());
        if (req.salaryMin() != null && req.salaryMax() != null && req.salaryMax() < req.salaryMin()) {
            throw ApiException.badRequest("Maximum salary cannot be lower than minimum salary");
        }
        job.setTitle(req.title().trim());
        job.setDescription(req.description().trim());
        job.setCategory(req.category().trim());
        job.setCity(req.city().trim());
        job.setState(req.state().trim());
        job.setJobType(req.jobType());
        job.setSalaryMin(req.salaryMin());
        job.setSalaryMax(req.salaryMax());
        job.setMinExperienceYears(req.minExperienceYears());
        job.setOpenings(req.openings());
        job.getSkills().clear();
        job.getSkills().addAll(skillService.resolve(req.skillIds()));
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

    private static String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
