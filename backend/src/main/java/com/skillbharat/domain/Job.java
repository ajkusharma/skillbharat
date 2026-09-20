package com.skillbharat.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "category", nullable = false, length = 60)
    private String category;

    @Column(name = "city", nullable = false, length = 80)
    private String city;

    @Column(name = "state", nullable = false, length = 80)
    private String state;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 20)
    private JobType jobType = JobType.FULL_TIME;

    /** Monthly salary range in INR. */
    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(name = "min_experience_years", nullable = false)
    private Integer minExperienceYears = 0;

    @Column(name = "openings", nullable = false)
    private Integer openings = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JobStatus status = JobStatus.DRAFT;

    /** Admin switch: an approved job is only public while active. */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @ManyToMany
    @JoinTable(name = "job_skills",
            joinColumns = @JoinColumn(name = "job_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id"))
    @BatchSize(size = 50)
    private Set<Skill> skills = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "posted_at")
    private Instant postedAt;

    /** Visible to job seekers only when approved, switched on, and its employer is approved and enabled. */
    public boolean isPubliclyVisible() {
        return status == JobStatus.APPROVED
                && active
                && company.getStatus() == CompanyStatus.APPROVED
                && company.getOwner().isActive();
    }
}
