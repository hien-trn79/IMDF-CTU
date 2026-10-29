package com.example.backend_imdf_ctu.repository;

import com.example.backend_imdf_ctu.entity.SysLayerAuditLogs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SysLayerAuditLogRepository extends JpaRepository<SysLayerAuditLogs, Integer> {
}
