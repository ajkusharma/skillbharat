package com.skillbharat.web.dto;

import com.skillbharat.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public static final String PHONE_REGEX = "^[6-9][0-9]{9}$";
    public static final String PHONE_MESSAGE = "Enter a valid 10-digit Indian mobile number";
    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$";
    public static final String PASSWORD_MESSAGE = "Password must be 8-72 characters and include a letter and a number";

    public record RegisterCandidateRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Pattern(regexp = PHONE_REGEX, message = PHONE_MESSAGE) String phone,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password) {
    }

    public record RegisterEmployerRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Pattern(regexp = PHONE_REGEX, message = PHONE_MESSAGE) String phone,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password,
            @NotBlank @Size(max = 150) String companyName,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record UserInfo(Long id, String fullName, String email, Role role) {
    }

    public record AuthResponse(String token, UserInfo user) {
    }
}
