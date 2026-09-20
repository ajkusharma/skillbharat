package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Resume;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.ResumeRepository;
import com.skillbharat.security.AuthUser;
import com.skillbharat.storage.FileStorage;
import com.skillbharat.web.dto.CandidateDtos.ResumeInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final ResumeRepository resumes;
    private final CandidateProfileRepository profiles;
    private final ApplicationRepository applications;
    private final FileStorage storage;

    public record ResumeFile(Resource resource, String filename, String contentType) {
    }

    @Transactional
    public ResumeInfo upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Choose a resume file to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("Resume must be 5 MB or smaller");
        }
        String original = safeName(file.getOriginalFilename());
        String ext = extension(original);
        String contentType = CONTENT_TYPES.get(ext);
        if (contentType == null) {
            throw ApiException.badRequest("Only PDF, DOC or DOCX resumes are accepted");
        }
        if (!signatureMatches(ext, head(file))) {
            throw ApiException.badRequest("The file content does not match a valid ." + ext + " document");
        }

        CandidateProfile profile = profiles.findByUserId(userId)
                .orElseThrow(() -> ApiException.notFound("Candidate profile not found"));

        String key = UUID.randomUUID() + "." + ext;
        try (InputStream in = file.getInputStream()) {
            storage.store(key, in);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the resume. Please try again.");
        }

        Resume resume = new Resume();
        resume.setProfile(profile);
        resume.setOriginalFilename(original);
        resume.setStorageKey(key);
        resume.setContentType(contentType);
        resume.setSizeBytes(file.getSize());
        return Mappers.resume(resumes.save(resume));
    }

    /**
     * Access rule: the owner, an admin, or an employer who received this resume with an application
     * to one of their own jobs. Everyone else gets a 404 so resume ids cannot be probed.
     */
    @Transactional(readOnly = true)
    public ResumeFile openForDownload(AuthUser actor, Long resumeId) {
        Resume resume = resumes.findById(resumeId)
                .orElseThrow(() -> ApiException.notFound("Resume not found"));
        boolean allowed = switch (actor.role()) {
            case ADMIN -> true;
            case JOB_SEEKER -> resume.getProfile().getUser().getId().equals(actor.id());
            case EMPLOYER -> applications.employerCanSeeResume(resumeId, actor.id());
        };
        if (!allowed) {
            throw ApiException.notFound("Resume not found");
        }
        return new ResumeFile(storage.load(resume.getStorageKey()), resume.getOriginalFilename(),
                resume.getContentType());
    }

    private static byte[] head(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(8);
        } catch (IOException e) {
            throw ApiException.badRequest("The uploaded file could not be read");
        }
    }

    private static boolean signatureMatches(String ext, byte[] b) {
        return switch (ext) {
            case "pdf" -> b.length >= 4 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F';
            case "docx" -> b.length >= 2 && b[0] == 'P' && b[1] == 'K';
            case "doc" -> b.length >= 4 && (b[0] & 0xFF) == 0xD0 && (b[1] & 0xFF) == 0xCF
                    && (b[2] & 0xFF) == 0x11 && (b[3] & 0xFF) == 0xE0;
            default -> false;
        };
    }

    private static String safeName(String name) {
        String n = name == null ? "resume" : name.replace("\\", "/");
        n = n.substring(n.lastIndexOf('/') + 1).replaceAll("[\\r\\n\"]", "").trim();
        if (n.isEmpty()) {
            n = "resume";
        }
        return n.length() > 200 ? n.substring(n.length() - 200) : n;
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
