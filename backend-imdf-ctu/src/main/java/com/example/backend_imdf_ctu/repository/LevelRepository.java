package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LevelRepository extends JpaRepository<Level, Integer> {

    List<Level> findAllByBuildingId(Integer buildingId);
}

