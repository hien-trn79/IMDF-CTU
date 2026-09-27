package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.NetworkNodes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NetworkNodesRepository extends JpaRepository<NetworkNodes, Integer> {
}
