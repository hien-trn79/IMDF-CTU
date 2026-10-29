package com.example.backend_imdf_ctu.controller;

import com.example.backend_imdf_ctu.dto.request.SysLayerPublishRequest;
import com.example.backend_imdf_ctu.entity.SysLayer;
import com.example.backend_imdf_ctu.service.interfaces.SysLayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping("/layers")
@RestController
@CrossOrigin
@RequiredArgsConstructor
public class LayerManagementController {

    private final SysLayerService sysLayerService;

    @GetMapping
    public ResponseEntity<List<SysLayer>> getAllLayers() {
        return ResponseEntity.ok(sysLayerService.getAllLayers());
    }

    @GetMapping("/styles")
    public ResponseEntity<List<String>> getAvailableStyles() {
        return ResponseEntity.ok(sysLayerService.getAvailableStyles());
    }

    @PostMapping("/publish")
    public ResponseEntity<SysLayer> publishLayer(@RequestBody SysLayerPublishRequest request) {
        SysLayer layer = sysLayerService.registerAndPublishLayer(request);
        return ResponseEntity.ok(layer);
    }

    @PostMapping(value = "/publish", params = "tableName")
    public ResponseEntity<SysLayer> publishLayerByParams(
        @RequestParam String tableName,
        @RequestParam String displayName,
        @RequestParam String geometryType,
        @RequestParam(required = false) Integer levelId
    ) {
        SysLayer layer = sysLayerService.registerAndPublishLayer(tableName, displayName, geometryType, levelId);
        return ResponseEntity.ok(layer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLayer(@PathVariable Integer id) {
        boolean deleted = sysLayerService.deleteLayer(id);
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Đã xóa layer thành công", "layerId", id));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/wms-url")
    public ResponseEntity<?> getWmsUrlInfo(@RequestParam String layerName, @RequestParam(required = false) Integer levelId) {
        String geoserverWmsUrl = "/geoserver/imdf_ctu/wms";
        String cqlFilter = (levelId != null) ? "level_id=" + levelId : "INCLUDE";

        Map<String, Object> response = Map.of(
            "wmsUrl", geoserverWmsUrl,
            "layerName", "imdf_ctu:" + layerName,
            "cqlFilter", cqlFilter,
            "format", "image/png",
            "transparent", true
        );

        return ResponseEntity.ok(response);
    }
}
