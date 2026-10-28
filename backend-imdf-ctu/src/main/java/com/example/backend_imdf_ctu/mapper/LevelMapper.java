package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.dto.response.LevelResponse;
import com.example.backend_imdf_ctu.entity.Level;
import com.example.backend_imdf_ctu.entity.LevelCategory;
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

    public Level toEntity(LevelRequest request, LevelCategory levelCategory) {
        Level entity = new Level();

        // apply attributes
        entity.setOutdoor(request.getOutdoor());
        entity.setOrdinal(request.getOrdinal());

        applyRelations(request, levelCategory, entity);

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

        return response;
    }

    public void update(
        Level entity,
        LevelRequest request,
        LevelCategory levelCategory
    ) {
        // apply attributes
        entity.setOutdoor(request.getOutdoor());
        entity.setOrdinal(request.getOrdinal());

        applyRelations(request, levelCategory, entity);

        // Apply geometry conversion
        applyGeometry(request, entity);
    }

//    ======= private methods =======

    private void applyRelations(
        LevelRequest request,
        LevelCategory levelCategory,
        Level entity
    ) {
        entity.setLevelCategory(levelCategory);
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
