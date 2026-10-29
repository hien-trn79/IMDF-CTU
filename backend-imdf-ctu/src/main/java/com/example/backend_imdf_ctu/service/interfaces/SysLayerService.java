package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.SysLayerPublishRequest;
import com.example.backend_imdf_ctu.entity.SysLayer;

import java.util.List;

public interface SysLayerService {
    SysLayer registerAndPublishLayer(SysLayerPublishRequest request);

    SysLayer registerAndPublishLayer(
        String tableName,
        String displayName,
        String geometryType,
        Integer levelId);

    List<SysLayer> getAllLayers();

    List<String> getAvailableStyles();

    boolean deleteLayer(Integer layerId);
}
