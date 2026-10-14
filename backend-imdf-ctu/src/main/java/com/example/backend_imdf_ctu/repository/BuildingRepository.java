package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {
}
