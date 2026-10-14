package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.AmenityCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AmenityCategoryRepository extends JpaRepository<AmenityCategory, Integer> {
}
