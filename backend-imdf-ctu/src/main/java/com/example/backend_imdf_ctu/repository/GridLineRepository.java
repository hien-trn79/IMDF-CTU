package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.GridLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GridLineRepository extends JpaRepository<GridLine, Integer> {

    List<GridLine> findAllByIndoorRouteLevelId(Integer levelId);
}
