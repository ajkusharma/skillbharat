package com.skillbharat.web.dto;

import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record DashboardStats(
            long candidates,
            long employers,
            long pendingEmployers,
            long totalJobs,
            long pendingJobs,
            long liveJobs,
            long totalApplications,
            Map<ApplicationStatus, Long> applicationsByStatus) {
    }

    public record UserView(Long id, String fullName, String email, String phone, Role role, boolean active,
                           Instant createdAt, Instant lastLoginAt) {
    }

    public record CompanyView(
            Long id,
            String name,
            String description,
            String industry,
            String city,
            String state,
            String website,
            CompanyStatus status,
            String rejectionReason,
            Long ownerId,
            String ownerName,
            String ownerEmail,
            boolean ownerActive,
            long jobCount,
            Instant createdAt,
            Instant reviewedAt) {
    }

    public record RejectRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record ActiveRequest(@NotNull Boolean active) {
    }

    public record AuditLogView(Long id, Long actorId, String actorEmail, String action, String entityType,
                               Long entityId, String details, Instant createdAt) {
    }
}
