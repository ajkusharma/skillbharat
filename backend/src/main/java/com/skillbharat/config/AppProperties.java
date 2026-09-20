package com.skillbharat.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Storage storage, Seed seed, BootstrapAdmin bootstrapAdmin) {

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Storage(String localDir) {
    }

    public record Seed(boolean enabled) {
    }

    public record BootstrapAdmin(String email, String password, String name) {
    }
}
