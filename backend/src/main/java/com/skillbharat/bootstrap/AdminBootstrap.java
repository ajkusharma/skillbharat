package com.skillbharat.bootstrap;

import com.skillbharat.config.AppProperties;
import com.skillbharat.domain.Role;
import com.skillbharat.domain.User;
import com.skillbharat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Creates the first Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD when the platform has none.
 * This is the production path: demo seeding is optional, but you always need one admin.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final AppProperties props;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppProperties.BootstrapAdmin cfg = props.bootstrapAdmin();
        if (cfg == null || !StringUtils.hasText(cfg.email()) || !StringUtils.hasText(cfg.password())) {
            return;
        }
        if (users.existsByRole(Role.ADMIN) || users.existsByEmailIgnoreCase(cfg.email().trim())) {
            return;
        }
        User admin = new User();
        admin.setEmail(cfg.email().trim().toLowerCase());
        admin.setFullName(StringUtils.hasText(cfg.name()) ? cfg.name().trim() : "Platform Admin");
        admin.setPasswordHash(encoder.encode(cfg.password()));
        admin.setRole(Role.ADMIN);
        users.save(admin);
        log.info("Created bootstrap super admin {}", admin.getEmail());
    }
}
