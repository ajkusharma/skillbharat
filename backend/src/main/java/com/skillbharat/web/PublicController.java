package com.skillbharat.web;

import com.skillbharat.security.AuthUser;
import com.skillbharat.service.PublicJobService;
import com.skillbharat.web.dto.CommonDtos.PageResponse;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import com.skillbharat.web.dto.JobDtos.PublicMeta;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public")
public class PublicController {

    private final PublicJobService publicJobs;

    @GetMapping("/jobs")
    public PageResponse<JobSummary> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long skillId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return publicJobs.search(keyword, city, category, skillId, page, size);
    }

    /** Anonymous callers get the plain job; a signed-in job seeker also gets their applied/saved state. */
    @GetMapping("/jobs/{id}")
    public JobDetail detail(@PathVariable Long id, @AuthenticationPrincipal AuthUser viewer) {
        return publicJobs.detail(id, viewer);
    }

    @GetMapping("/meta")
    public PublicMeta meta() {
        return publicJobs.meta();
    }
}
