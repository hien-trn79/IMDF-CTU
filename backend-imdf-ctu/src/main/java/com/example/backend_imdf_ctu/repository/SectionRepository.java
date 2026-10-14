package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepository extends JpaRepository<Section, Integer> {
}
