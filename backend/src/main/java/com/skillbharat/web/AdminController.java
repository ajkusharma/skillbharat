package com.skillbharat.web;

import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.Role;
import com.skillbharat.security.AuthUser;
import com.skillbharat.service.AdminService;
import com.skillbharat.service.AuditService;
import com.skillbharat.web.dto.AdminDtos.ActiveRequest;
import com.skillbharat.web.dto.AdminDtos.AuditLogView;
import com.skillbharat.web.dto.AdminDtos.CompanyView;
import com.skillbharat.web.dto.AdminDtos.DashboardStats;
import com.skillbharat.web.dto.AdminDtos.RejectRequest;
import com.skillbharat.web.dto.AdminDtos.UserView;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationRow;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
public class AdminController {

    private final AdminService admin;
    private final AuditService audit;

    @GetMapping("/dashboard")
    public DashboardStats dashboard() {
        return admin.dashboard();
    }

    @GetMapping("/users")
    public PageResponse<UserView> users(@RequestParam(required = false) Role role,
                                        @RequestParam(required = false) String q,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return admin.users(role, q, page, size);
    }

    @PatchMapping("/users/{id}/active")
    public UserView setUserActive(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                  @Valid @RequestBody ActiveRequest req) {
        return admin.setUserActive(me, id, req.active());
    }

    @GetMapping("/employers")
    public PageResponse<CompanyView> employers(@RequestParam(required = false) CompanyStatus status,
                                               @RequestParam(required = false) String q,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return admin.employers(status, q, page, size);
    }

    @PostMapping("/employers/{id}/approve")
    public CompanyView approveEmployer(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return admin.approveEmployer(me, id);
    }

    @PostMapping("/employers/{id}/reject")
    public CompanyView rejectEmployer(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                      @Valid @RequestBody RejectRequest req) {
        return admin.rejectEmployer(me, id, req.reason());
    }

    @GetMapping("/jobs")
    public PageResponse<JobSummary> jobs(@RequestParam(required = false) JobStatus status,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return admin.jobs(status, q, page, size);
    }

    @GetMapping("/jobs/{id}")
    public JobDetail job(@PathVariable Long id) {
        return admin.job(id);
    }

    @PostMapping("/jobs/{id}/approve")
    public JobDetail approveJob(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return admin.approveJob(me, id);
    }

    @PostMapping("/jobs/{id}/reject")
    public JobDetail rejectJob(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                               @Valid @RequestBody RejectRequest req) {
        return admin.rejectJob(me, id, req.reason());
    }

    @PatchMapping("/jobs/{id}/active")
    public JobDetail setJobActive(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                  @Valid @RequestBody ActiveRequest req) {
        return admin.setJobActive(me, id, req.active());
    }

    @GetMapping("/applications")
    public PageResponse<ApplicationRow> applications(@RequestParam(required = false) ApplicationStatus status,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return admin.applications(status, page, size);
    }

    @GetMapping("/audit-logs")
    public PageResponse<AuditLogView> auditLogs(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "25") int size) {
        return audit.list(page, size);
    }
}
