package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.Application;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.SavedJob;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.JobRepository;
import com.skillbharat.repository.ResumeRepository;
import com.skillbharat.repository.SavedJobRepository;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationView;
import com.skillbharat.web.dto.ApplicationDtos.ApplyRequest;
import com.skillbharat.web.dto.ApplicationDtos.SavedJobView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

/** A job seeker's own activity: applying, tracking applications and saving jobs. */
@Service
@RequiredArgsConstructor
public class CandidateJobService {

    private final CandidateProfileRepository profiles;
    private final JobRepository jobs;
    private final ApplicationRepository applications;
    private final SavedJobRepository savedJobs;
    private final ResumeRepository resumes;

    @Transactional
    public ApplicationView apply(Long userId, Long jobId, ApplyRequest req) {
        CandidateProfile profile = profile(userId);
        if (!StringUtils.hasText(profile.getCity())) {
            throw ApiException.badRequest("Add your location to your profile before applying");
        }
        Job job = openJob(jobId);
        if (applications.existsByJobIdAndCandidateId(jobId, profile.getId())) {
            throw ApiException.conflict("You have already applied to this job");
        }

        Application application = new Application();
        application.setJob(job);
        application.setCandidate(profile);
        application.setResume(resumes.findFirstByProfileIdOrderByUploadedAtDesc(profile.getId()).orElse(null));
        String note = req == null ? null : req.coverNote();
        application.setCoverNote(StringUtils.hasText(note) ? note.trim() : null);
        return view(applications.save(application));
    }

    @Transactional(readOnly = true)
    public List<ApplicationView> myApplications(Long userId) {
        CandidateProfile profile = profile(userId);
        return applications.findByCandidateIdOrderByAppliedAtDesc(profile.getId()).stream()
                .map(CandidateJobService::view).toList();
    }

    @Transactional
    public void save(Long userId, Long jobId) {
        CandidateProfile profile = profile(userId);
        Job job = openJob(jobId);
        if (!savedJobs.existsByCandidateIdAndJobId(profile.getId(), jobId)) {
            SavedJob saved = new SavedJob();
            saved.setCandidate(profile);
            saved.setJob(job);
            savedJobs.save(saved);
        }
    }

    @Transactional
    public void unsave(Long userId, Long jobId) {
        CandidateProfile profile = profile(userId);
        savedJobs.findByCandidateIdAndJobId(profile.getId(), jobId).ifPresent(savedJobs::delete);
    }

    @Transactional(readOnly = true)
    public List<SavedJobView> savedJobs(Long userId) {
        CandidateProfile profile = profile(userId);
        return savedJobs.findByCandidateIdOrderBySavedAtDesc(profile.getId()).stream()
                .filter(s -> s.getJob().isPubliclyVisible())
                .map(s -> new SavedJobView(s.getJob().getId(), s.getSavedAt(),
                        Mappers.jobSummary(s.getJob(), null, false)))
                .toList();
    }

    private CandidateProfile profile(Long userId) {
        return profiles.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Candidate profile not found"));
    }

    private Job openJob(Long jobId) {
        return jobs.findById(jobId)
                .filter(Job::isPubliclyVisible)
                .orElseThrow(() -> ApiException.notFound("This job was not found or is no longer open"));
    }

    private static ApplicationView view(Application a) {
        Job job = a.getJob();
        return new ApplicationView(a.getId(), a.getStatus(), a.getAppliedAt(), a.getUpdatedAt(), a.getCoverNote(),
                job.getId(), job.getTitle(), job.getCompany().getName(), job.getCity(), job.getState(),
                job.isPubliclyVisible());
    }
}
