package com.skillbharat.service;

import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.Resume;
import com.skillbharat.domain.Skill;
import com.skillbharat.domain.User;
import com.skillbharat.web.dto.AdminDtos.UserView;
import com.skillbharat.web.dto.CandidateDtos.EducationDto;
import com.skillbharat.web.dto.CandidateDtos.ExperienceDto;
import com.skillbharat.web.dto.CandidateDtos.ProfileResponse;
import com.skillbharat.web.dto.CandidateDtos.ResumeInfo;
import com.skillbharat.web.dto.CommonDtos.SkillDto;
import com.skillbharat.web.dto.EmployerDtos.CompanyResponse;
import com.skillbharat.web.dto.JobDtos.JobDetail;
import com.skillbharat.web.dto.JobDtos.JobSummary;
import com.skillbharat.web.dto.JobDtos.ViewerState;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;

/** Entity to DTO conversion. Call inside a transaction: several of these touch lazy associations. */
public final class Mappers {

    private Mappers() {
    }

    public static SkillDto skill(Skill s) {
        return new SkillDto(s.getId(), s.getName(), s.getCategory());
    }

    public static List<SkillDto> skills(Collection<Skill> skills) {
        return skills.stream().sorted(Comparator.comparing(Skill::getName)).map(Mappers::skill).toList();
    }

    public static List<String> skillNames(Collection<Skill> skills) {
        return skills.stream().map(Skill::getName).sorted().toList();
    }

    /** ownerView adds the fields only the job's owner (or an admin) should see. */
    public static JobSummary jobSummary(Job j, Long applicationCount, boolean ownerView) {
        Company c = j.getCompany();
        return new JobSummary(
                j.getId(), j.getTitle(), c.getId(), c.getName(), j.getCity(), j.getState(), j.getCategory(),
                j.getJobType(), j.getSalaryMin(), j.getSalaryMax(), j.getMinExperienceYears(), j.getOpenings(),
                skillNames(j.getSkills()), j.getStatus(), j.isActive(),
                ownerView ? j.getRejectionReason() : null,
                ownerView ? applicationCount : null,
                j.getPostedAt(), j.getCreatedAt());
    }

    public static JobDetail jobDetail(Job j, boolean ownerView, ViewerState viewer) {
        Company c = j.getCompany();
        return new JobDetail(
                j.getId(), j.getTitle(), j.getDescription(), c.getId(), c.getName(), c.getIndustry(),
                c.getDescription(), c.getWebsite(), j.getCategory(), j.getCity(), j.getState(), j.getJobType(),
                j.getSalaryMin(), j.getSalaryMax(), j.getMinExperienceYears(), j.getOpenings(),
                skills(j.getSkills()), j.getStatus(), j.isActive(),
                ownerView ? j.getRejectionReason() : null,
                j.getPostedAt(), j.getCreatedAt(), viewer);
    }

    public static CompanyResponse company(Company c) {
        return new CompanyResponse(c.getId(), c.getName(), c.getDescription(), c.getIndustry(), c.getCity(),
                c.getState(), c.getWebsite(), c.getStatus(), c.getRejectionReason(), c.getReviewedAt(),
                c.getCreatedAt());
    }

    public static UserView user(User u) {
        return new UserView(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRole(), u.isActive(),
                u.getCreatedAt(), u.getLastLoginAt());
    }

    public static ResumeInfo resume(Resume r) {
        return r == null ? null
                : new ResumeInfo(r.getId(), r.getOriginalFilename(), r.getSizeBytes(), r.getUploadedAt());
    }

    public static ProfileResponse profile(CandidateProfile p, Resume latestResume, int completeness) {
        User u = p.getUser();
        List<EducationDto> education = p.getEducation().stream()
                .map(e -> new EducationDto(e.getDegree(), e.getInstitution(), e.getYearOfCompletion())).toList();
        List<ExperienceDto> experience = p.getExperience().stream()
                .map(e -> new ExperienceDto(e.getJobTitle(), e.getCompanyName(), e.getStartDate(), e.getEndDate(),
                        e.getDescription())).toList();
        return new ProfileResponse(p.getId(), u.getFullName(), u.getEmail(), u.getPhone(), p.getHeadline(),
                p.getCity(), p.getState(), p.getSummary(), p.getTotalExperienceYears(), skills(p.getSkills()),
                education, experience, resume(latestResume), completeness);
    }
}
