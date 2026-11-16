package com.example.backend_imdf_ctu.service.implement;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.IndoorShortestPathRequest;
import com.example.backend_imdf_ctu.mapper.GeometryConverter;
import com.example.backend_imdf_ctu.repository.IndoorRoutingRepository;
import com.example.backend_imdf_ctu.service.interfaces.IndoorRoutingService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndoorRoutingServiceImpl implements IndoorRoutingService {

    private final IndoorRoutingRepository repository;
    private final GeometryConverter geometryConverter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(readOnly = true)
    public GeoJsonFeatureCollection getShortestPath(IndoorShortestPathRequest request) {
        if (request == null || request.getTargetNodeId() == null || request.getTargetLevelId() == null) {
            return GeoJsonFeatureCollection.builder()
                .features(new ArrayList<>())
                .build();
        }

        String sourceType = request.getSourceLocationType() != null
            ? request.getSourceLocationType().name()
            : "unit";
        String targetType = request.getTargetLocationType() != null
            ? request.getTargetLocationType().name()
            : "unit";

        List<IndoorRoutingRepository.GeoJsonProjection> projections =
            repository.findMultiFloorShortestPath(
                request.getSourceNodeId(),
                sourceType,
                request.getSourceLevelId(),
                request.getTargetNodeId(),
                targetType,
                request.getTargetLevelId(),
                request.getIsOutdoorIncluded()
            );

        if (projections == null || projections.isEmpty()) {
            return GeoJsonFeatureCollection.builder()
                .features(new ArrayList<>())
                .build();
        }

        List<GeoJsonFeature> features = projections.stream()
            .map(item -> {
                GeoJsonFeature feature = new GeoJsonFeature();
                feature.setId(item.getId());

                org.locationtech.jts.geom.Geometry jtsGeometry =
                    geometryConverter.toJts(item.getGeometry());
                feature.setGeometry(geometryConverter.toGeoJson(jtsGeometry));

                try {
                    if (item.getProperties() != null) {
                        Map<String, Object> props = objectMapper.readValue(
                            item.getProperties(),
                            new TypeReference<Map<String, Object>>() {}
                        );
                        feature.setProperties(props);
                    } else {
                        feature.setProperties(Map.of());
                    }
                } catch (Exception e) {
                    log.error("Cannot parse GeoJSON properties for feature ID: {}", item.getId(), e);
                    feature.setProperties(Map.of());
                }

                return feature;
            })
            .toList();

        return GeoJsonFeatureCollection.builder()
            .features(features)
            .build();
    }
}