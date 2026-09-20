package com.skillbharat.service;

import com.skillbharat.common.ApiException;
import com.skillbharat.domain.Skill;
import com.skillbharat.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skills;

    /** Loads the skills for the given ids, rejecting any id that does not exist. */
    public Set<Skill> resolve(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        List<Skill> found = skills.findAllById(ids);
        if (found.size() != ids.size()) {
            throw ApiException.badRequest("One or more selected skills do not exist");
        }
        return new HashSet<>(found);
    }

    public void requireCategory(String category) {
        if (!skills.findCategories().contains(category.trim())) {
            throw ApiException.badRequest("Choose a valid trade category");
        }
    }
}
