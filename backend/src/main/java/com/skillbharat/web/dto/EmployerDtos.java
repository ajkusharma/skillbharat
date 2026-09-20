package com.skillbharat.web.dto;

import com.skillbharat.domain.CompanyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class EmployerDtos {

    private EmployerDtos() {
    }

    public record CompanyRequest(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 3000) String description,
            @Size(max = 100) String industry,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @Size(max = 200) @Pattern(regexp = "^$|^https?://.+", message = "Website must start with http:// or https://") String website) {
    }

    public record CompanyResponse(
            Long id,
            String name,
            String description,
            String industry,
            String city,
            String state,
            String website,
            CompanyStatus status,
            String rejectionReason,
            Instant reviewedAt,
            Instant createdAt) {
    }

    public record EmployerDashboard(
            CompanyStatus companyStatus,
            String companyName,
            long totalJobs,
            long draftJobs,
            long pendingJobs,
            long approvedJobs,
            long rejectedJobs,
            long totalApplications,
            long newApplications,
            long shortlisted,
            long rejectedApplications) {
    }
}
