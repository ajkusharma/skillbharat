package com.skillbharat.web;

import com.skillbharat.security.AuthUser;
import com.skillbharat.service.AuthService;
import com.skillbharat.web.dto.AuthDtos.AuthResponse;
import com.skillbharat.web.dto.AuthDtos.LoginRequest;
import com.skillbharat.web.dto.AuthDtos.RegisterCandidateRequest;
import com.skillbharat.web.dto.AuthDtos.RegisterEmployerRequest;
import com.skillbharat.web.dto.AuthDtos.UserInfo;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final AuthService auth;

    @PostMapping("/register/candidate")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerCandidate(@Valid @RequestBody RegisterCandidateRequest req) {
        return auth.registerCandidate(req);
    }

    @PostMapping("/register/employer")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerEmployer(@Valid @RequestBody RegisterEmployerRequest req) {
        return auth.registerEmployer(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public UserInfo me(@AuthenticationPrincipal AuthUser me) {
        return auth.me(me.id());
    }
}
