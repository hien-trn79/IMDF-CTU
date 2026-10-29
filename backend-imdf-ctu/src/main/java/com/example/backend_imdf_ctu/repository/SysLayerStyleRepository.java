package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.SysLayerStyles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SysLayerStyleRepository extends JpaRepository<SysLayerStyles, Integer> {
}
