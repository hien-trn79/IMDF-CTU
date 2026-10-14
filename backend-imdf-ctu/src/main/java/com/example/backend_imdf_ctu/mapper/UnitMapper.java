package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import com.example.backend_imdf_ctu.entity.*;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class UnitMapper {

    private final MultiPolygonNormalizer normalizer;
    private final GeometryConverter geometryConverter;

    public UnitMapper(
        GeometryConverter geometryConverter,
        MultiPolygonNormalizer normalizer
    ) {
        this.geometryConverter = geometryConverter;
        this.normalizer = normalizer;
    }

//    =========== private method ===========
    private void applyRelations(
        Unit entity,
        UnitCategory unitCategory,
        Feature feature,
        RestrictionCategory restrictionCategory,
        Level level
    ) {
        entity.setFeature(feature);
        entity.setUnitCategory(unitCategory);
        entity.setRestrictionCategory(restrictionCategory);
        entity.setLevel(level);
    }

    public void applyGeometry(UnitRequest request, Unit entity) {
        MultiPolygon geom = normalizer.normalize(geometryConverter.toJts(request.getGeometry()));
        entity.setGeometry(geom);

        Point point;

        if(request.getDisplayPoint() != null) {
            Geometry converted = geometryConverter.toJts(request.getDisplayPoint());

            if (!(converted instanceof Point p)) {
                throw new IllegalArgumentException("Display point must be a Point geometry.");
            }

            if (!geom.covers(p)) {
                throw new IllegalArgumentException("Display point must be within the geometry.");
            }

            point = p;
        } else {
            point = geom.getInteriorPoint();
        }

        point.setSRID(4326);
        entity.setDisplayPoint(point);
    }

//    ========== public method ===========
    public Unit toEntity(
        UnitRequest request,
        UnitCategory unitCategory,
        Feature feature,
        RestrictionCategory restrictionCategory,
        Level level
    ) {
        Unit entity = new Unit();

        entity.setUnitName(request.getUnitName());

        applyRelations(
            entity,
            unitCategory,
            feature,
            restrictionCategory,
            level
        );

        // Apply geometry conversion
        applyGeometry(request, entity);

        return entity;
    }

    public UnitResponse toResponse(Unit entity) {
        UnitResponse response = new UnitResponse();

        response.setId(entity.getId());
        response.setUnitId(entity.getUnitId().toString());
        response.setUnitName(entity.getUnitName());

        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));
        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));

        if (entity.getFeature() != null) {
            response.setFeatureId(entity.getFeature().getId());
            response.setFeatureType(entity.getFeature().getFeatureType());
        }

        if (entity.getLevel() != null) {
            response.setLevelId(entity.getLevel().getId());
            response.setOrdinal(entity.getLevel().getOrdinal());
        }

        if (entity.getUnitCategory() != null) {
            response.setUnitCategoryId(entity.getUnitCategory().getId());
            response.setUnitCategoryName(entity.getUnitCategory().getUnitCategoryName());
        }

        if (entity.getRestrictionCategory() != null) {
            response.setRestrictionCategoryId(entity.getRestrictionCategory().getId());
            response.setRestrictionCategoryName(entity.getRestrictionCategory().getRestrictionCateName());
        }

        return response;
    }

    public void update(
        UnitRequest request,
        UnitCategory unitCategory,
        Feature feature,
        RestrictionCategory restrictionCategory,
        Level level,
        Unit entity
    ) {
        entity.setUnitName(request.getUnitName());

        applyRelations(
            entity,
            unitCategory,
            feature,
            restrictionCategory,
            level
        );

        // Apply geometry conversion
        applyGeometry(request, entity);
    }
}
