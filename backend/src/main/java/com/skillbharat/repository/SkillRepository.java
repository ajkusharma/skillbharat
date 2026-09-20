package com.skillbharat.repository;

import com.skillbharat.domain.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    List<Skill> findAllByOrderByCategoryAscNameAsc();

    Optional<Skill> findByNameIgnoreCase(String name);

    @Query("select distinct s.category from Skill s order by s.category")
    List<String> findCategories();
}
