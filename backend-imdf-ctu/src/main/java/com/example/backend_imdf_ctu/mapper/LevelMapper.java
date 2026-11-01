package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.dto.response.LevelResponse;
import com.example.backend_imdf_ctu.entity.Building;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.entity.LevelCategory;
import com.example.backend_imdf_ctu.entity.RestrictionCategory;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class LevelMapper {
    private final GeometryConverter geometryConverter;

    private final MultiPolygonNormalizer normalizer;

    public LevelMapper (
        GeometryConverter geometryConverter,
        MultiPolygonNormalizer normalizer
    ) {
        this.geometryConverter = geometryConverter;
        this.normalizer = normalizer;
    }

    public Level toEntity(
        LevelRequest request,
        LevelCategory levelCategory,
        RestrictionCategory restrictionCategory,
        Building building
    ) {
        Level entity = new Level();

        // apply attributes
        entity.setOutdoor(request.getOutdoor());
        entity.setOrdinal(request.getOrdinal());


        applyRelations(request, levelCategory, entity, restrictionCategory, building);

        // Apply geometry conversion
        applyGeometry(request, entity);

        return entity;
    }

    public LevelResponse toResponse(Level entity) {
        LevelResponse response = new LevelResponse();

        response.setId(entity.getId());
        response.setLevelId(entity.getLevelId());

        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));
        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));

        response.setOutdoor(entity.getOutdoor());
        response.setOrdinal(entity.getOrdinal());

        response.setLevelCategoryId(entity.getLevelCategory().getId());
        response.setLevelCategoryName(entity.getLevelCategory().getLevelCategoryName());

        response.setRestrictionCategoryId(entity.getRestrictionCategory().getId());
        response.setRestrictionCategoryName(entity.getRestrictionCategory().getRestrictionCateVietnameseName());

        response.setBuildingId(entity.getBuilding().getId());
        response.setBuildingName(entity.getBuilding().getBuildingName());

        return response;
    }

    public void update(
        Level entity,
        LevelRequest request,
        LevelCategory levelCategory,
        RestrictionCategory restrictionCategory,
        Building building
    ) {
        // apply attributes
        entity.setOutdoor(request.getOutdoor());
        entity.setOrdinal(request.getOrdinal());

        applyRelations(request, levelCategory, entity, restrictionCategory, building);

        // Apply geometry conversion
        applyGeometry(request, entity);
    }

//    ======= private methods =======

    private void applyRelations(
        LevelRequest request,
        LevelCategory levelCategory,
        Level entity,
        RestrictionCategory restrictionCategory,
        Building building
    ) {
        entity.setLevelCategory(levelCategory);
        entity.setRestrictionCategory(restrictionCategory);
        entity.setBuilding(building);
    }

    private void applyGeometry(LevelRequest request, Level entity) {
        MultiPolygon geom = normalizer.normalize(geometryConverter.toJts(request.getGeometry()));

        geom.setSRID(4326);
        entity.setGeometry(geom);

        Point displayPoint;

        if(request.getDisplayPoint() != null) {
            Geometry converted = geometryConverter.toJts(request.getDisplayPoint());

            if(!(converted instanceof Point p)) {
                throw new IllegalArgumentException("Display point must be a Point geometry");
            }

            if(!geom.covers(p)) {
                throw new IllegalArgumentException("Display point must be within the level geometry");
            }
            displayPoint = p;
        } else {
            displayPoint = geom.getInteriorPoint();
        }

        displayPoint.setSRID(4326);
        entity.setDisplayPoint(displayPoint);
    }
}
