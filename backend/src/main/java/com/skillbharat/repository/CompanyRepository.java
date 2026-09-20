package com.skillbharat.repository;

import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long>, JpaSpecificationExecutor<Company> {

    Optional<Company> findByOwnerId(Long ownerId);

    long countByStatus(CompanyStatus status);
}
