package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;
import com.example.backend_imdf_ctu.entity.*;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;


@Component
public class AmenityMapper {

    private final GeometryConverter geometryConverter;

    public AmenityMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
    }

    public AmenityResponse toResponse(
        Amenity entity) {
         AmenityResponse response = new AmenityResponse();

         response.setId(entity.getId());
         response.setAmenityId(entity.getAmenityId().toString());

         response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));

         response.setHours(entity.getHours());
         response.setPhone(entity.getPhone());
         response.setWebsite(entity.getWebsite());
         response.setCorrelationId(entity.getCorrelationId().toString());

         response.setAmenityCategoryId(entity.getAmenityCategory().getId());
            response.setAmenityCategoryName(entity.getAmenityCategory().getAmenityCategoryName());

         response.setFeatureId(entity.getFeature().getId());
         response.setFeatureType(entity.getFeature().getFeatureType());

         response.setUnitId(entity.getUnit().getId());
         response.setUnitName(entity.getUnit().getUnitName());
         return response;
    }

    public Amenity toEntity(
        AmenityRequest request,
        AmenityCategory amenityCategory,
        Feature feature,
        Unit unit,
        Level level
    ) {
        Amenity entity = new Amenity();

        entity.setAmenityId(java.util.UUID.randomUUID());
        entity.setCorrelationId(java.util.UUID.randomUUID());
        entity.setAmenityName(request.getAmenityName());

        Geometry geom = geometryConverter.toJts(request.getGeometry());
        if(!(geom instanceof Point point)) {
            throw new IllegalArgumentException("Amenity chỉ chấp nhận Point, nhận được: " + geom.getGeometryType());
        }
        if (Math.abs(point.getX()) > 180 || Math.abs(point.getY()) > 90) {
            throw new IllegalArgumentException("Tọa độ không hợp lệ: x: " + point.getX() + ", y: " + point.getY());
        }

        entity.setGeometry(point);

        entity.setHours(request.getHours());
        entity.setPhone(request.getPhone());
        entity.setWebsite(request.getWebsite());

        entity.setAmenityCategory(amenityCategory);
        entity.setFeature(feature);
        entity.setUnit(unit);
        entity.setLevel(level);

        return entity;
    }

    public Amenity updateEntity(
        Amenity entity,
        AmenityRequest request,
        AmenityCategory amenityCategory,
        Feature feature,
        Unit unit,
        Level level
    ) {
        entity.setAmenityName(request.getAmenityName());

        Geometry geom = geometryConverter.toJts(request.getGeometry());
        if(!(geom instanceof Point point)) {
            throw new IllegalArgumentException("Amenity chỉ chấp nhận Point, nhận được: " + geom.getGeometryType());
        }
        if (Math.abs(point.getX()) > 180 || Math.abs(point.getY()) > 90) {
            throw new IllegalArgumentException("Tọa độ không hợp lệ: x: " + point.getX() + ", y: " + point.getY());
        }

        entity.setGeometry(point);

        entity.setHours(request.getHours());
        entity.setPhone(request.getPhone());
        entity.setWebsite(request.getWebsite());

        entity.setAmenityCategory(amenityCategory);
        entity.setFeature(feature);
        entity.setUnit(unit);
        entity.setLevel(level);

        return entity;
    }
}
