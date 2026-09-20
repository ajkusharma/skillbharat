package com.skillbharat.repository;

import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    List<Job> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    long countByStatus(JobStatus status);

    long countByStatusAndActive(JobStatus status, boolean active);

    long countByCompanyId(Long companyId);

    long countByCompanyIdAndStatus(Long companyId, JobStatus status);

    @Query("select j.company.id, count(j) from Job j where j.company.id in :companyIds group by j.company.id")
    List<Object[]> countGroupedByCompany(@Param("companyIds") Collection<Long> companyIds);

    @Query("select j.category, count(j) from Job j "
            + "where j.status = :status and j.active = true and j.company.status = :companyStatus "
            + "and j.company.owner.active = true group by j.category")
    List<Object[]> countOpenByCategory(@Param("status") JobStatus status,
                                       @Param("companyStatus") CompanyStatus companyStatus);
}
