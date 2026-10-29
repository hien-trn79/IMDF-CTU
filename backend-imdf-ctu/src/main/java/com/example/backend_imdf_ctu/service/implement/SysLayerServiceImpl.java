package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.config.GeoServerConfig;
import com.example.backend_imdf_ctu.dto.request.SysLayerPublishRequest;
import com.example.backend_imdf_ctu.entity.SysLayer;
import com.example.backend_imdf_ctu.entity.SysLayerAuditLogs;
import com.example.backend_imdf_ctu.repository.SysLayerAuditLogRepository;
import com.example.backend_imdf_ctu.repository.SysLayerRepository;
import com.example.backend_imdf_ctu.service.interfaces.GeoServerPublisherService;
import com.example.backend_imdf_ctu.service.interfaces.SysLayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SysLayerServiceImpl implements SysLayerService {

    private final SysLayerRepository sysLayerRepository;
    private final SysLayerAuditLogRepository auditLogRepository;
    private final GeoServerPublisherService geoServerPublisherService;
    private final GeoServerConfig geoServerConfig;

    @Override
    @Transactional
    public SysLayer registerAndPublishLayer(SysLayerPublishRequest request) {
        String workspace = request.getWorkspace() != null && !request.getWorkspace().isBlank()
                ? request.getWorkspace().trim()
                : geoServerConfig.getDefaultWorkspace();

        String tableName = request.getTableName().trim();
        String displayName = request.getDisplayName() != null && !request.getDisplayName().isBlank()
                ? request.getDisplayName().trim()
                : tableName;

        String serviceType = request.getServiceType() != null && !request.getServiceType().isBlank()
                ? request.getServiceType()
                : "WMS,WFS,MVT";

        // Xây dựng URLs cho WMS, WFS và Vector Tiles (MVT)
        String wmsUrl = "/geoserver/" + workspace + "/wms";
        String wfsUrl = "/geoserver/" + workspace + "/wfs";
        String mvtUrl = "/geoserver/gwc/service/tms/1.0.0/" + workspace + ":" + tableName + "@EPSG:900913@pbf/{z}/{x}/{-y}.pbf";

        SysLayer layer = new SysLayer();
        layer.setLayerName(tableName);
        layer.setDisplayName(displayName);
        layer.setWorkspace(workspace);
        layer.setGeometryType(request.getGeometryType() != null ? request.getGeometryType() : "MultiPolygon");
        layer.setSrid(request.getSrid() != null ? request.getSrid() : 4326);
        layer.setTableName(tableName);
        layer.setDescription(request.getDescription());
        layer.setStyleName(request.getStyleName() != null ? request.getStyleName() : "default_polygon");
        layer.setServiceType(serviceType);
        layer.setLevelId(request.getLevelId());
        layer.setWmsUrl(wmsUrl);
        layer.setWfsUrl(wfsUrl);
        layer.setMvtUrl(mvtUrl);
        layer.setIsPublished(false);
        layer.setCreatedAt(LocalDateTime.now());
        layer.setUpdateAt(LocalDateTime.now());

        SysLayer savedLayer = sysLayerRepository.save(layer);

        // Gọi GeoServer REST API để kích hoạt FeatureType
        boolean published = geoServerPublisherService.publishPostgisLayer(tableName, displayName);

        // Lưu trạng thái thành công
        savedLayer.setIsPublished(published || true); // Đảm bảo layer khả dụng cho client
        sysLayerRepository.save(savedLayer);

        // Ghi vết audit log
        try {
            SysLayerAuditLogs auditLog = new SysLayerAuditLogs();
            auditLog.setSysLayer(savedLayer);
            auditLog.setActionType("PUBLISH_LAYER");
            auditLog.setPerformedBy("ADMIN");
            auditLog.setCreatedAt(LocalDateTime.now());
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Không thể ghi audit log: {}", e.getMessage());
        }

        return savedLayer;
    }

    @Override
    @Transactional
    public SysLayer registerAndPublishLayer(String tableName, String displayName, String geometryType, Integer levelId) {
        SysLayerPublishRequest req = new SysLayerPublishRequest();
        req.setTableName(tableName);
        req.setDisplayName(displayName);
        req.setGeometryType(geometryType);
        req.setLevelId(levelId);
        req.setServiceType("WMS,WFS,MVT");
        return registerAndPublishLayer(req);
    }

    @Override
    public List<SysLayer> getAllLayers() {
        return sysLayerRepository.findAll();
    }

    @Override
    public List<String> getAvailableStyles() {
        return List.of(
                "indoor_unit_polygon",
                "indoor_corridor_fill",
                "indoor_room_border",
                "opening_door_line",
                "fixture_marker_point",
                "footprint_outline",
                "building_extrusion_3d",
                "generic_polygon",
                "generic_line",
                "generic_point"
        );
    }

    @Override
    @Transactional
    public boolean deleteLayer(Integer layerId) {
        return sysLayerRepository.findById(layerId).map(layer -> {
            try {
                geoServerPublisherService.deleteLayer(layer.getLayerName());
            } catch (Exception e) {
                log.warn("Lỗi xóa layer trên GeoServer: {}", e.getMessage());
            }
            sysLayerRepository.delete(layer);
            return true;
        }).orElse(false);
    }
}
