package com.skillbharat.web.dto;

import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.web.dto.CandidateDtos.ProfileResponse;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    public record ApplyRequest(@Size(max = 1000) String coverNote) {
    }

    public record StatusUpdateRequest(@NotNull ApplicationStatus status) {
    }

    /** What a job seeker sees in "My applications". */
    public record ApplicationView(
            Long id,
            ApplicationStatus status,
            Instant appliedAt,
            Instant updatedAt,
            String coverNote,
            Long jobId,
            String jobTitle,
            String companyName,
            String city,
            String state,
            boolean jobStillOpen) {
    }

    /** A row in the employer's (or admin's) application list. */
    public record ApplicationRow(
            Long id,
            ApplicationStatus status,
            Instant appliedAt,
            Long jobId,
            String jobTitle,
            String companyName,
            Long candidateId,
            String candidateName,
            String candidateCity,
            String candidateState,
            Integer candidateExperienceYears,
            List<String> candidateSkills,
            boolean hasResume) {
    }

    public record ApplicationDetail(
            Long id,
            ApplicationStatus status,
            Instant appliedAt,
            Instant updatedAt,
            String coverNote,
            Long jobId,
            String jobTitle,
            Long resumeId,
            String resumeFilename,
            ProfileResponse candidate) {
    }

    public record SavedJobView(Long jobId, Instant savedAt, JobDtos.JobSummary job) {
    }
}
