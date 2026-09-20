package com.skillbharat.repository;

import com.skillbharat.domain.Application;
import com.skillbharat.domain.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {

    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

    Optional<Application> findByJobIdAndCandidateId(Long jobId, Long candidateId);

    List<Application> findByCandidateIdOrderByAppliedAtDesc(Long candidateId);

    long countByStatus(ApplicationStatus status);

    @Query("select a.status, count(a) from Application a group by a.status")
    List<Object[]> countGroupedByStatus();

    @Query("select a.status, count(a) from Application a where a.job.company.id = :companyId group by a.status")
    List<Object[]> countGroupedByStatusForCompany(@Param("companyId") Long companyId);

    @Query("select a.job.id, count(a) from Application a where a.job.id in :jobIds group by a.job.id")
    List<Object[]> countGroupedByJob(@Param("jobIds") Collection<Long> jobIds);

    /** True when the resume was submitted with an application to a job owned by this employer. */
    @Query("select case when count(a) > 0 then true else false end from Application a "
            + "where a.resume.id = :resumeId and a.job.company.owner.id = :ownerId")
    boolean employerCanSeeResume(@Param("resumeId") Long resumeId, @Param("ownerId") Long ownerId);
}
