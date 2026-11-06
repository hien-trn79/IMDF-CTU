package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {

    List<Building> findAllByVenueId(Integer id);
}
