package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.BuildingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingCategoryRepository extends JpaRepository<BuildingCategory, Integer> {
}
