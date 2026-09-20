package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Education;
import com.skillbharat.domain.Experience;
import com.skillbharat.domain.Resume;
import com.skillbharat.domain.User;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.ResumeRepository;
import com.skillbharat.web.dto.CandidateDtos.EducationDto;
import com.skillbharat.web.dto.CandidateDtos.ExperienceDto;
import com.skillbharat.web.dto.CandidateDtos.ProfileRequest;
import com.skillbharat.web.dto.CandidateDtos.ProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CandidateProfileService {

    private final CandidateProfileRepository profiles;
    private final ResumeRepository resumes;
    private final SkillService skillService;

    @Transactional(readOnly = true)
    public ProfileResponse get(Long userId) {
        return toResponse(load(userId));
    }

    @Transactional
    public ProfileResponse update(Long userId, ProfileRequest req) {
        CandidateProfile p = load(userId);

        User user = p.getUser();
        user.setFullName(req.fullName().trim());
        user.setPhone(req.phone());

        p.setHeadline(clean(req.headline()));
        p.setCity(req.city().trim());
        p.setState(req.state().trim());
        p.setSummary(clean(req.summary()));
        p.setTotalExperienceYears(req.totalExperienceYears());

        p.getSkills().clear();
        p.getSkills().addAll(skillService.resolve(req.skillIds()));

        p.getEducation().clear();
        if (req.education() != null) {
            for (EducationDto dto : req.education()) {
                Education e = new Education();
                e.setProfile(p);
                e.setDegree(dto.degree().trim());
                e.setInstitution(clean(dto.institution()));
                e.setYearOfCompletion(dto.yearOfCompletion());
                p.getEducation().add(e);
            }
        }

        p.getExperience().clear();
        if (req.experience() != null) {
            for (ExperienceDto dto : req.experience()) {
                if (dto.startDate() != null && dto.endDate() != null && dto.endDate().isBefore(dto.startDate())) {
                    throw ApiException.badRequest("End date cannot be before start date for " + dto.jobTitle());
                }
                Experience e = new Experience();
                e.setProfile(p);
                e.setJobTitle(dto.jobTitle().trim());
                e.setCompanyName(clean(dto.companyName()));
                e.setStartDate(dto.startDate());
                e.setEndDate(dto.endDate());
                e.setDescription(clean(dto.description()));
                p.getExperience().add(e);
            }
        }

        p.setUpdatedAt(Instant.now());
        return toResponse(p);
    }

    /** Shared with the employer's application review. Call inside a transaction. */
    public ProfileResponse toResponse(CandidateProfile p) {
        Resume latest = resumes.findFirstByProfileIdOrderByUploadedAtDesc(p.getId()).orElse(null);
        return Mappers.profile(p, latest, completeness(p, latest));
    }

    private CandidateProfile load(Long userId) {
        return profiles.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Candidate profile not found"));
    }

    static int completeness(CandidateProfile p, Resume resume) {
        int score = 0;
        if (StringUtils.hasText(p.getCity()) && StringUtils.hasText(p.getState())) score += 20;
        if (StringUtils.hasText(p.getHeadline())) score += 10;
        if (!p.getSkills().isEmpty()) score += 20;
        if (!p.getEducation().isEmpty()) score += 15;
        if (!p.getExperience().isEmpty() || p.getTotalExperienceYears() != null) score += 15;
        if (resume != null) score += 20;
        return score;
    }

    private static String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
