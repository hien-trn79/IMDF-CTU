package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LevelRepository extends JpaRepository<Level, Integer> {
}

