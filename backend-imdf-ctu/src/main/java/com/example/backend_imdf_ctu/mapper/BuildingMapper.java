package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import com.example.backend_imdf_ctu.entity.*;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class BuildingMapper {
    private final GeometryConverter geometryConverter;

    private final MultiPolygonNormalizer normalizer;

    public BuildingMapper(
        GeometryConverter geometryConverter,
        MultiPolygonNormalizer normalizer
    ) {
        this.geometryConverter = geometryConverter;
        this.normalizer = normalizer;
    }

    public Building toEntity(
        BuildingRequest request,
        Feature feature,
        Address address,
        RestrictionCategory restrictionCategory,
        BuildingCategory buildingCategory
    ) {
        Building entity = new Building();

        applyRelations(
            feature,
            address,
            restrictionCategory,
            buildingCategory,
            entity
        );

        // Apply geometry conversion
        applyGeometry(request, entity);

        return entity;
    }

    public BuildingResponse toResponse(Building entity) {
        BuildingResponse response = new BuildingResponse();

        response.setId(entity.getId());
        response.setBuildingId(entity.getBuildingId());

        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));
        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));

        if (entity.getFeature() != null) {
            response.setFeatureId(entity.getFeature().getId());
        }

        if (entity.getAddress() != null) {
            response.setAddressId(entity.getAddress().getId());
        }

        if (entity.getRestrictionCategory() != null) {
            response.setRestrictionCategoryId(entity.getRestrictionCategory().getId());
        }

        if (entity.getBuildingCategory() != null) {
            response.setBuildingCategoryId(entity.getBuildingCategory().getId());
        }

        return response;
    }

    public void update(
        BuildingRequest request,
        Feature feature,
        Address address,
        RestrictionCategory restrictionCategory,
        BuildingCategory buildingCategory,
        Building entity
    ) {
        // apply Relations
        applyRelations(
            feature,
            address,
            restrictionCategory,
            buildingCategory,
            entity
        );

        // Apply geometry conversion
        applyGeometry(request, entity);
    }

//    ========= private methods =========
    private void applyRelations(
        Feature feature,
        Address address,
        RestrictionCategory restrictionCategory,
        BuildingCategory buildingCategory,
        Building entity
    ) {
        entity.setBuildingCategory(buildingCategory);
        entity.setAddress(address);
        entity.setFeature(feature);
        entity.setRestrictionCategory(restrictionCategory);
    }

    private void applyGeometry(
        BuildingRequest request,
        Building entity
    ) {
        // Apply geometry conversion
        MultiPolygon geom = normalizer.normalize(geometryConverter.toJts(request.getGeometry()));

        entity.setGeometry(geom);

        Point point;
        if(request.getDisplayPoint() != null) {
            Geometry converted = geometryConverter.toJts(request.getDisplayPoint());

            if (!(converted instanceof Point p)) {
                throw new IllegalArgumentException("Display point must be a Point geometry.");
            }

            if (!geom.covers(p))
                throw new IllegalArgumentException("Display point must be within the building geometry.");

            point = p;
        } else {
            point = geom.getInteriorPoint();
        }

        point.setSRID(4326);
        entity.setDisplayPoint(point);
    }
}
