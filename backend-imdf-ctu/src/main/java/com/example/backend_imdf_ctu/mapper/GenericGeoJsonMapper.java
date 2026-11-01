package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeature;
import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.entity.GeoJson;
import org.locationtech.jts.geom.Geometry;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GenericGeoJsonMapper {

    private final GeometryConverter geometryConverter;

    public GenericGeoJsonMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    /**
     * Chuyển 1 Entity đơn lẻ thành GeoJSON Feature
     */
    public <T extends GeoJson> GeoJsonFeature toFeature(T entity) {
        Map<String, Object> properties = new HashMap<>();

        if (entity.getProperties() != null) {
            entity.getProperties().forEach((key, value) -> {
                // Nếu property là JTS Geometry (ví dụ displayPoint), tự động convert sang GeoJSON
                if (value instanceof Geometry geom) {
                    properties.put(key, geometryConverter.toGeoJson(geom));
                } else {
                    properties.put(key, value);
                }
            });
        }

        return GeoJsonFeature.builder()
            .id(entity.getId())
            .geometry(geometryConverter.toGeoJson(entity.getGeometry()))
            .properties(properties)
            .build();
    }

    /**
     * Chuyển danh sách Entities thành GeoJSON FeatureCollection
     */
    public <T extends GeoJson> GeoJsonFeatureCollection toFeatureCollection(List<T> entities) {
        List<GeoJsonFeature> features = entities.stream()
            .map(this::toFeature)
            .toList();

        return GeoJsonFeatureCollection.builder()
            .features(features)
            .build();
    }

    /**
     * Chuyển Page<T> thành GeoJSON FeatureCollection kèm phân trang
     */
    public <T extends GeoJson> GeoJsonFeatureCollection toFeatureCollection(Page<T> page) {
        List<GeoJsonFeature> features = page.getContent().stream()
            .map(this::toFeature)
            .toList();

        Map<String, Object> paginationMeta = Map.of(
            "pageNumber", page.getNumber(),
            "pageSize", page.getSize(),
            "totalElements", page.getTotalElements(),
            "totalPages", page.getTotalPages(),
            "isLast", page.isLast()
        );

        return GeoJsonFeatureCollection.builder()
            .features(features)
            .pagination(paginationMeta)
            .build();
    }
}
