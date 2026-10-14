package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.RestrictionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RestrictionCateRepository extends JpaRepository<RestrictionCategory, Integer> {
}
