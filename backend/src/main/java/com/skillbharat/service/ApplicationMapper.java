package com.skillbharat.service;

import com.skillbharat.domain.Application;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.Resume;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationDetail;
import com.skillbharat.web.dto.ApplicationDtos.ApplicationRow;
import com.skillbharat.web.dto.CandidateDtos.ProfileResponse;

/** Application to DTO conversion shared by the employer and admin views. Call inside a transaction. */
public final class ApplicationMapper {

    private ApplicationMapper() {
    }

    public static ApplicationRow row(Application a) {
        Job job = a.getJob();
        CandidateProfile c = a.getCandidate();
        return new ApplicationRow(a.getId(), a.getStatus(), a.getAppliedAt(), job.getId(), job.getTitle(),
                job.getCompany().getName(), c.getId(), c.getUser().getFullName(), c.getCity(), c.getState(),
                c.getTotalExperienceYears(), Mappers.skillNames(c.getSkills()), a.getResume() != null);
    }

    public static ApplicationDetail detail(Application a, ProfileResponse candidate) {
        Resume resume = a.getResume();
        return new ApplicationDetail(a.getId(), a.getStatus(), a.getAppliedAt(), a.getUpdatedAt(), a.getCoverNote(),
                a.getJob().getId(), a.getJob().getTitle(),
                resume == null ? null : resume.getId(),
                resume == null ? null : resume.getOriginalFilename(),
                candidate);
    }
}
