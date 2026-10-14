package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.VenueCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VenueCategoryRepository extends JpaRepository<VenueCategory, Integer> {
}
