package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.RelationShip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RelationShipRepository extends JpaRepository<RelationShip, Integer> {
}
