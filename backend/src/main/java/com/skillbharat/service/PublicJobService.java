package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.Application;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.Role;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.CompanyRepository;
import com.skillbharat.repository.JobRepository;
import com.skillbharat.repository.SavedJobRepository;
import com.skillbharat.repository.SkillRepository;
import com.skillbharat.repository.UserRepository;
import com.skillbharat.security.AuthUser;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.CommonDtos.SkillDto;
import com.skillbharat.web.dto.JobDtos.CategoryCount;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import com.skillbharat.web.dto.JobDtos.PublicMeta;
import com.skillbharat.web.dto.JobDtos.PublicStats;
import com.skillbharat.web.dto.JobDtos.ViewerState;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/** Everything a visitor or job seeker can browse: approved, active jobs from approved employers. */
@Service
@RequiredArgsConstructor
public class PublicJobService {

    private final JobRepository jobs;
    private final SkillRepository skills;
    private final UserRepository users;
    private final CompanyRepository companies;
    private final ApplicationRepository applications;
    private final SavedJobRepository savedJobs;
    private final CandidateProfileRepository profiles;

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> search(String keyword, String city, String category, Long skillId,
                                           int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "postedAt", "id"));
        Page<Job> result = jobs.findAll(Specs.publicJobs(keyword, city, category, skillId), pageable);
        return PageResponse.of(result.map(j -> Mappers.jobSummary(j, null, false)));
    }

    @Transactional(readOnly = true)
    public JobDetail detail(Long id, AuthUser viewer) {
        Job job = jobs.findById(id)
                .filter(Job::isPubliclyVisible)
                .orElseThrow(() -> ApiException.notFound("This job was not found or is no longer open"));
        return Mappers.jobDetail(job, false, viewerState(job, viewer));
    }

    @Transactional(readOnly = true)
    public PublicMeta meta() {
        List<SkillDto> allSkills = skills.findAllByOrderByCategoryAscNameAsc().stream().map(Mappers::skill).toList();

        List<CategoryCount> categories = jobs.countOpenByCategory(JobStatus.APPROVED, CompanyStatus.APPROVED).stream()
                .map(row -> new CategoryCount((String) row[0], (Long) row[1]))
                .toList();
        long openJobs = categories.stream().mapToLong(CategoryCount::openJobs).sum();

        // Every trade category is listed, including those with no open jobs yet.
        List<CategoryCount> merged = skills.findCategories().stream()
                .map(cat -> new CategoryCount(cat, categories.stream()
                        .filter(c -> c.category().equals(cat)).mapToLong(CategoryCount::openJobs).sum()))
                .toList();

        PublicStats stats = new PublicStats(openJobs, companies.countByStatus(CompanyStatus.APPROVED),
                users.countByRole(Role.JOB_SEEKER));
        return new PublicMeta(allSkills, merged, stats);
    }

    private ViewerState viewerState(Job job, AuthUser viewer) {
        if (viewer == null || viewer.role() != Role.JOB_SEEKER) {
            return null;
        }
        Optional<CandidateProfile> profile = profiles.findByUserId(viewer.id());
        if (profile.isEmpty()) {
            return null;
        }
        Long profileId = profile.get().getId();
        Optional<Application> application = applications.findByJobIdAndCandidateId(job.getId(), profileId);
        return new ViewerState(application.isPresent(),
                application.map(Application::getStatus).orElse(null),
                savedJobs.existsByCandidateIdAndJobId(profileId, job.getId()));
    }
}
