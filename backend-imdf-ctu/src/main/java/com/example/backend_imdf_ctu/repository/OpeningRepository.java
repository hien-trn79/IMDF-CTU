package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Opening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OpeningRepository extends JpaRepository<Opening, Integer> {
}
