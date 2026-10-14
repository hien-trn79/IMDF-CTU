package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.LevelCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LevelCategoryRepository extends JpaRepository<LevelCategory, Integer> {
}
