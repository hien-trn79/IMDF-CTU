package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.EntityHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EntityHistoryRepository extends JpaRepository<EntityHistory, Integer> {
}
