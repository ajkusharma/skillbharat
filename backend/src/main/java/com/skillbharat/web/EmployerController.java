package com.skillbharat.web;

import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.security.AuthUser;
import com.skillbharat.service.EmployerService;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationDetail;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationRow;
import com.skillbharat.web.dto.ApplicationDtos.StatusUpdateRequest;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.EmployerDtos.CompanyRequest;
import com.skillbharat.web.dto.EmployerDtos.CompanyResponse;
import com.skillbharat.web.dto.EmployerDtos.EmployerDashboard;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobRequest;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
@Tag(name = "Employer")
public class EmployerController {

    private final EmployerService employers;

    @GetMapping("/dashboard")
    public EmployerDashboard dashboard(@AuthenticationPrincipal AuthUser me) {
        return employers.dashboard(me.id());
    }

    @GetMapping("/company")
    public CompanyResponse company(@AuthenticationPrincipal AuthUser me) {
        return employers.company(me.id());
    }

    @PutMapping("/company")
    public CompanyResponse updateCompany(@AuthenticationPrincipal AuthUser me,
                                         @Valid @RequestBody CompanyRequest req) {
        return employers.updateCompany(me.id(), req);
    }

    @GetMapping("/jobs")
    public List<JobSummary> jobs(@AuthenticationPrincipal AuthUser me) {
        return employers.listJobs(me.id());
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public JobDetail createJob(@AuthenticationPrincipal AuthUser me, @Valid @RequestBody JobRequest req) {
        return employers.createJob(me.id(), req);
    }

    @GetMapping("/jobs/{id}")
    public JobDetail job(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return employers.getJob(me.id(), id);
    }

    @PutMapping("/jobs/{id}")
    public JobDetail updateJob(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                               @Valid @RequestBody JobRequest req) {
        return employers.updateJob(me.id(), id, req);
    }

    @PostMapping("/jobs/{id}/submit")
    public JobDetail submitJob(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return employers.submitJob(me.id(), id);
    }

    @GetMapping("/applications")
    public PageResponse<ApplicationRow> applications(
            @AuthenticationPrincipal AuthUser me,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return employers.listApplications(me.id(), jobId, status, page, size);
    }

    @GetMapping("/applications/{id}")
    public ApplicationDetail application(@AuthenticationPrincipal AuthUser me, @PathVariable Long id) {
        return employers.applicationDetail(me.id(), id);
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationDetail decide(@AuthenticationPrincipal AuthUser me, @PathVariable Long id,
                                    @Valid @RequestBody StatusUpdateRequest req) {
        return employers.decide(me, id, req.status());
    }
}
