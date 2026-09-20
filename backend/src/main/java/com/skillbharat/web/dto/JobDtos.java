package com.skillbharat.web.dto;

import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.JobType;
import com.skillbharat.web.dto.CommonDtos.SkillDto;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class JobDtos {

    private JobDtos() {
    }

    public record JobRequest(
            @NotBlank @Size(max = 150) String title,
            @NotBlank @Size(min = 20, max = 5000) String description,
            @NotBlank @Size(max = 60) String category,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @NotNull JobType jobType,
            @Min(0) @Max(10_000_000) Integer salaryMin,
            @Min(0) @Max(10_000_000) Integer salaryMax,
            @NotNull @Min(0) @Max(50) Integer minExperienceYears,
            @NotNull @Min(1) @Max(1000) Integer openings,
            @Size(max = 15) Set<Long> skillIds) {
    }

    /** Card / table row. Owner-only fields (rejectionReason, applicationCount) are null on public endpoints. */
    public record JobSummary(
            Long id,
            String title,
            Long companyId,
            String companyName,
            String city,
            String state,
            String category,
            JobType jobType,
            Integer salaryMin,
            Integer salaryMax,
            Integer minExperienceYears,
            Integer openings,
            List<String> skills,
            JobStatus status,
            boolean active,
            String rejectionReason,
            Long applicationCount,
            Instant postedAt,
            Instant createdAt) {
    }

    public record ViewerState(boolean applied, ApplicationStatus applicationStatus, boolean saved) {
    }

    public record JobDetail(
            Long id,
            String title,
            String description,
            Long companyId,
            String companyName,
            String companyIndustry,
            String companyDescription,
            String companyWebsite,
            String category,
            String city,
            String state,
            JobType jobType,
            Integer salaryMin,
            Integer salaryMax,
            Integer minExperienceYears,
            Integer openings,
            List<SkillDto> skills,
            JobStatus status,
            boolean active,
            String rejectionReason,
            Instant postedAt,
            Instant createdAt,
            ViewerState viewer) {
    }

    public record CategoryCount(String category, long openJobs) {
    }

    public record PublicStats(long openJobs, long employers, long candidates) {
    }

    public record PublicMeta(List<SkillDto> skills, List<CategoryCount> categories, PublicStats stats) {
    }
}
