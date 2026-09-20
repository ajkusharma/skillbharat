package com.skillbharat.security;

import com.skillbharat.domain.Role;

/** The authenticated caller, resolved from the JWT on every request. */
public record AuthUser(Long id, String email, Role role) {
}
