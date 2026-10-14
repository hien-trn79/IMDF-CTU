package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.SectionRequest;
import com.example.backend_imdf_ctu.dto.response.SectionResponse;
import com.example.backend_imdf_ctu.entity.*;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Component;

@Component
public class SectionMapper {
    private final GeometryConverter geometryConverter;

    public SectionMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public SectionResponse toResponse(Section entity) {
        SectionResponse response = new SectionResponse();

        response.setId(entity.getId());
        response.setSectionId(entity.getSectionId());
        response.setSectionName(entity.getSectionName());

        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));
        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));

        if (entity.getSectionCategory() != null) {
            response.setSectionCategoryId(entity.getSectionCategory().getId());
            response.setSectionCategoryName(entity.getSectionCategory().getSectionCategoryName());
        }

        if (entity.getFeature() != null) {
            response.setFeatureId(entity.getFeature().getId());
            response.setFeatureType(entity.getFeature().getFeatureType());
        }
        if (entity.getLevel() != null) {
            response.setLevelId(entity.getLevel().getId());
            response.setOrdinal(entity.getLevel().getOrdinal());
        }

        if (entity.getRestrictionCategory() != null) {
            response.setRestrictionCateId(entity.getRestrictionCategory().getId());
            response.setRestrictionCateName(entity.getRestrictionCategory().getRestrictionCateName());
        }

        return response;
    }

    public Section toEntity(
        SectionRequest request,
        SectionCategory sectionCategory,
        Feature feature,
        Level level,
        RestrictionCategory restrictionCategory
    ) {
        Section entity = new Section();

        entity.setSectionName(request.getSectionName());

        applyGeometry(entity, request);

        applyRelations(entity, sectionCategory, feature, level, restrictionCategory);

        return entity;
    }

    public void update(
        Section entity,
        SectionRequest request,
        SectionCategory sectionCategory,
        Feature feature,
        Level level,
        RestrictionCategory restrictionCategory
    ) {
        entity.setSectionName(request.getSectionName());

        applyGeometry(entity, request);

        applyRelations(entity, sectionCategory, feature, level, restrictionCategory);
    }

//    ========== private methods ==========

    private void applyRelations(
        Section entity,
        SectionCategory sectionCategory,
        Feature feature,
        Level level,
        RestrictionCategory restrictionCategory
    ) {
        entity.setSectionCategory(sectionCategory);
        entity.setFeature(feature);
        entity.setLevel(level);
        entity.setRestrictionCategory(restrictionCategory);
    }

    private void applyGeometry(
        Section entity,
        SectionRequest request
    ) {
        Geometry g = geometryConverter.toJts(request.getGeometry());

        if(g == null || g.isEmpty()) {
            throw new IllegalArgumentException("Geometry is null or empty");
        }

        if(!(g instanceof Polygon polygon)) {
            throw new IllegalArgumentException("Geometry is not a Polygon");
        }

        if(polygon.getNumPoints() < 4) {
            throw new IllegalArgumentException("Polygon must have at least 4 points");
        }

        entity.setGeometry(polygon);

        Point point;
        if (request.getDisplayPoint() != null) {
            Geometry dp = geometryConverter.toJts(request.getDisplayPoint());
            if (!(dp instanceof Point p)) {
                throw new BusinessException(ErrorCode.INVALID_GEOMETRY,
                    "DisplayPoint chỉ chấp nhận Point, nhận được: "
                        + (dp == null ? "null" : dp.getGeometryType()));
            }
            point = p;
        } else {
            point = polygon.getInteriorPoint();
        }
        point.setSRID(4326);

        entity.setDisplayPoint(point);
    }

}
