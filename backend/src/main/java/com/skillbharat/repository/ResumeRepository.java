package com.skillbharat.repository;

import com.skillbharat.domain.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    /** The candidate's current resume is simply the most recent upload. */
    Optional<Resume> findFirstByProfileIdOrderByUploadedAtDesc(Long profileId);
}
