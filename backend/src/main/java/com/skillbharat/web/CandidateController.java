package com.skillbharat.web;

import com.skillbharat.security.AuthUser;
import com.skillbharat.service.CandidateJobService;
import com.skillbharat.service.CandidateProfileService;
import com.skillbharat.service.ResumeService;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationView;
import com.skillbharat.web.dto.ApplicationDtos.ApplyRequest;
import com.skillbharat.web.dto.ApplicationDtos.SavedJobView;
import com.skillbharat.web.dto.CandidateDtos.ProfileRequest;
import com.skillbharat.web.dto.CandidateDtos.ProfileResponse;
import com.skillbharat.web.dto.CandidateDtos.ResumeInfo;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@Tag(name = "Job seeker")
public class CandidateController {

    private final CandidateProfileService profileService;
    private final ResumeService resumeService;
    private final CandidateJobService jobService;

    @GetMapping("/profile")
    public ProfileResponse profile(@AuthenticationPrincipal AuthUser me) {
        return profileService.get(me.id());
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(@AuthenticationPrincipal AuthUser me,
                                         @Valid @RequestBody ProfileRequest req) {
        return profileService.update(me.id(), req);
    }

    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ResumeInfo uploadResume(@AuthenticationPrincipal AuthUser me,
                                   @RequestPart("file") MultipartFile file) {
        return resumeService.upload(me.id(), file);
    }

    @PostMapping("/jobs/{jobId}/apply")
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationView apply(@AuthenticationPrincipal AuthUser me, @PathVariable Long jobId,
                                 @Valid @RequestBody(required = false) ApplyRequest req) {
        return jobService.apply(me.id(), jobId, req);
    }

    @GetMapping("/applications")
    public List<ApplicationView> applications(@AuthenticationPrincipal AuthUser me) {
        return jobService.myApplications(me.id());
    }

    @GetMapping("/saved-jobs")
    public List<SavedJobView> savedJobs(@AuthenticationPrincipal AuthUser me) {
        return jobService.savedJobs(me.id());
    }

    @PostMapping("/saved-jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@AuthenticationPrincipal AuthUser me, @PathVariable Long jobId) {
        jobService.save(me.id(), jobId);
    }

    @DeleteMapping("/saved-jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@AuthenticationPrincipal AuthUser me, @PathVariable Long jobId) {
        jobService.unsave(me.id(), jobId);
    }
}
