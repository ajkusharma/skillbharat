package com.skillbharat.web.dto;

import com.skillbharat.web.dto.CommonDtos.SkillDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public final class CandidateDtos {

    private CandidateDtos() {
    }

    public record EducationDto(
            @NotBlank @Size(max = 120) String degree,
            @Size(max = 150) String institution,
            @Min(1950) @Max(2100) Integer yearOfCompletion) {
    }

    public record ExperienceDto(
            @NotBlank @Size(max = 120) String jobTitle,
            @Size(max = 150) String companyName,
            LocalDate startDate,
            LocalDate endDate,
            @Size(max = 2000) String description) {
    }

    public record ProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Pattern(regexp = AuthDtos.PHONE_REGEX, message = AuthDtos.PHONE_MESSAGE) String phone,
            @Size(max = 150) String headline,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @Size(max = 2000) String summary,
            @Min(0) @Max(60) Integer totalExperienceYears,
            @Size(max = 20) Set<Long> skillIds,
            @Valid @Size(max = 10) List<EducationDto> education,
            @Valid @Size(max = 15) List<ExperienceDto> experience) {
    }

    public record ResumeInfo(Long id, String filename, long sizeBytes, Instant uploadedAt) {
    }

    public record ProfileResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String headline,
            String city,
            String state,
            String summary,
            Integer totalExperienceYears,
            List<SkillDto> skills,
            List<EducationDto> education,
            List<ExperienceDto> experience,
            ResumeInfo resume,
            int completeness) {
    }
}
