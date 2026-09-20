package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Role;
import com.skillbharat.domain.User;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.CompanyRepository;
import com.skillbharat.repository.UserRepository;
import com.skillbharat.security.JwtService;
import com.skillbharat.web.dto.AuthDtos.AuthResponse;
import com.skillbharat.web.dto.AuthDtos.LoginRequest;
import com.skillbharat.web.dto.AuthDtos.RegisterCandidateRequest;
import com.skillbharat.web.dto.AuthDtos.RegisterEmployerRequest;
import com.skillbharat.web.dto.AuthDtos.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BAD_CREDENTIALS = "Invalid email or password";

    private final UserRepository users;
    private final CandidateProfileRepository profiles;
    private final CompanyRepository companies;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @Transactional
    public AuthResponse registerCandidate(RegisterCandidateRequest req) {
        User user = createUser(req.fullName(), req.email(), req.phone(), req.password(), Role.JOB_SEEKER);
        CandidateProfile profile = new CandidateProfile();
        profile.setUser(user);
        profiles.save(profile);
        return respond(user);
    }

    @Transactional
    public AuthResponse registerEmployer(RegisterEmployerRequest req) {
        User user = createUser(req.fullName(), req.email(), req.phone(), req.password(), Role.EMPLOYER);
        Company company = new Company();
        company.setOwner(user);
        company.setName(req.companyName().trim());
        company.setCity(req.city().trim());
        company.setState(req.state().trim());
        company.setStatus(CompanyStatus.PENDING);
        companies.save(company);
        return respond(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> ApiException.unauthorized(BAD_CREDENTIALS));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized(BAD_CREDENTIALS);
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been deactivated. Please contact SkillBharat support.");
        }
        user.setLastLoginAt(Instant.now());
        return respond(user);
    }

    @Transactional(readOnly = true)
    public UserInfo me(Long userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Session expired"));
        return info(user);
    }

    private User createUser(String fullName, String email, String phone, String password, Role role) {
        String normalized = email.trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(normalized)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(normalized);
        user.setPhone(phone);
        user.setPasswordHash(encoder.encode(password));
        user.setRole(role);
        return users.save(user);
    }

    private AuthResponse respond(User user) {
        return new AuthResponse(jwt.generate(user), info(user));
    }

    private static UserInfo info(User u) {
        return new UserInfo(u.getId(), u.getFullName(), u.getEmail(), u.getRole());
    }
}
