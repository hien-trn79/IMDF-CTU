package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Integer> {

    List<Amenity> findAllByLevelId(Integer levelId);

    Amenity findAmenityByAmenityName(String amenityName, Integer levelId);
}
