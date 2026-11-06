package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.entity.*;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper {

    private final GeometryConverter geometryConverter;
    private final MultiPolygonNormalizer normalizer;

    public VenueMapper(GeometryConverter geometryConverter, MultiPolygonNormalizer normalizer) {
        this.geometryConverter = geometryConverter;
        this.normalizer = normalizer;
    }

    public Venue toEntity(
        VenueRequest request,
        Feature feature,
        VenueCategory venueCategory,
        Address address,
        RestrictionCategory restrictionCategory
    ) {
        Venue entity = new Venue();

        entity.setFeature(feature);
        entity.setVenueCategory(venueCategory);
        entity.setAddress(address);
        entity.setRestrictionCategory(restrictionCategory); // có thể null

        applyGeometry(request, entity);

        entity.setHours(request.getHours());
        entity.setPhone(request.getPhone());
        entity.setWebsite(request.getWebsite());

        return entity;
    }

    /** Chỉ cập nhật thuộc tính thường. Quan hệ và hình học do service xử lý. */
    public void updateScalars(
        VenueRequest request,
        Venue venue,
        Feature feature,
        VenueCategory venueCategory,
        Address address,
        RestrictionCategory restrictionCategory
    ) {
        venue.setHours(request.getHours());
        venue.setPhone(request.getPhone());
        venue.setWebsite(request.getWebsite());

        applyGeometry(request, venue);

        venue.setVenueCategory(venueCategory);
        venue.setFeature(feature);
        venue.setAddress(address);
        venue.setRestrictionCategory(restrictionCategory);
    }

//    private
    public void applyGeometry(
        VenueRequest request,
        Venue entity
    ) {
        MultiPolygon geom = normalizer.normalize(geometryConverter.toJts(request.getGeometry()));

        entity.setGeometry(geom);

        Point point;

        if (request.getDisplayPoint() != null) {
            Geometry converted = geometryConverter.toJts(request.getDisplayPoint());

            if(!(converted instanceof Point p)) {
                throw new IllegalArgumentException("Display point must be a Point geometry.");
            }
            point = p;
        } else {
            point = geom.getInteriorPoint();
        }

        point.setSRID(4326);
        entity.setDisplayPoint(point);
    }
}