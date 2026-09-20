package com.skillbharat.web.dto;

import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class CommonDtos {

    private CommonDtos() {
    }

    public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {
        public static <T> PageResponse<T> of(Page<T> page) {
            return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages());
        }
    }

    public record SkillDto(Long id, String name, String category) {
    }

    public record MessageResponse(String message) {
    }

    public record ApiError(Instant timestamp, int status, String error, String message,
                           Map<String, String> fieldErrors) {
    }
}
