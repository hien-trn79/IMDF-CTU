package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.UnitCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnitCategoryRepository extends JpaRepository<UnitCategory, Integer> {
}
