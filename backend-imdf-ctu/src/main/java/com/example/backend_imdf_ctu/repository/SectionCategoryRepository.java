package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.SectionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionCategoryRepository extends JpaRepository<SectionCategory, Integer> {
}
