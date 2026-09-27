package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.NetworkEdges;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NetworkEdgesRepository extends JpaRepository<NetworkEdges, Integer> {
}

