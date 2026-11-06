package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.NetworkEdges;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NetworkEdgesRepository extends JpaRepository<NetworkEdges, Integer> {

    List<NetworkEdges> findAllByIndoorRouteId(Integer indoorRouteId);
}

