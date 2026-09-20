package com.skillbharat.service;

import com.skillbharat.domain.Application;
import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.Role;
import com.skillbharat.domain.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Query filters. Optional filters are added only when supplied, which avoids nullable-parameter SQL. */
public final class Specs {

    private Specs() {
    }

    private static String pattern(String text) {
        String escaped = text.trim().toLowerCase()
                .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /** Jobs a job seeker is allowed to see. */
    public static Specification<Job> publicJobs(String keyword, String city, String category, Long skillId) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            Join<Job, Company> company = root.join("company");
            p.add(cb.equal(root.get("status"), JobStatus.APPROVED));
            p.add(cb.isTrue(root.get("active")));
            p.add(cb.equal(company.get("status"), CompanyStatus.APPROVED));
            p.add(cb.isTrue(company.join("owner").get("active")));
            if (StringUtils.hasText(keyword)) {
                String like = pattern(keyword);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like, '\\'),
                        cb.like(cb.lower(root.get("description")), like, '\\'),
                        cb.like(cb.lower(company.get("name")), like, '\\')));
            }
            if (StringUtils.hasText(city)) {
                p.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }
            if (StringUtils.hasText(category)) {
                p.add(cb.equal(root.get("category"), category.trim()));
            }
            if (skillId != null) {
                p.add(cb.equal(root.join("skills").get("id"), skillId));
                query.distinct(true);
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    /** Admin view of jobs, any state. */
    public static Specification<Job> adminJobs(JobStatus status, String q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            Join<Job, Company> company = root.join("company");
            if (status != null) {
                p.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(q)) {
                String like = pattern(q);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like, '\\'),
                        cb.like(cb.lower(company.get("name")), like, '\\')));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    public static Specification<User> users(Role role, String q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (role != null) {
                p.add(cb.equal(root.get("role"), role));
            }
            if (StringUtils.hasText(q)) {
                String like = pattern(q);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), like, '\\'),
                        cb.like(cb.lower(root.get("email")), like, '\\')));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    public static Specification<Company> companies(CompanyStatus status, String q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (status != null) {
                p.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(q)) {
                String like = pattern(q);
                p.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like, '\\'),
                        cb.like(cb.lower(root.join("owner").get("email")), like, '\\')));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    /**
     * Applications, optionally limited to one employer's jobs (ownerUserId), one job, or one status.
     * Pass ownerUserId = null for the admin-wide view.
     */
    public static Specification<Application> applications(Long ownerUserId, Long jobId, ApplicationStatus status) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            Join<Application, Job> job = root.join("job");
            if (ownerUserId != null) {
                p.add(cb.equal(job.get("company").get("owner").get("id"), ownerUserId));
            }
            if (jobId != null) {
                p.add(cb.equal(job.get("id"), jobId));
            }
            if (status != null) {
                p.add(cb.equal(root.get("status"), status));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }
}
