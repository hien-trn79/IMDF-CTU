package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Integer> {

    boolean existsByUnitId(UUID unitId);

    List<Unit> findAllByLevelId(Integer levelId);
}
