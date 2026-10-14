package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.VenueRequest;
import com.example.backend_imdf_ctu.dto.response.VenueResponse;
import com.example.backend_imdf_ctu.entity.*;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper {

    private final GeometryConverter geometryConverter;

    public VenueMapper(GeometryConverter geometryConverter) {
        this.geometryConverter = geometryConverter;
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

        entity.setHours(request.getHours());
        entity.setPhone(request.getPhone());
        entity.setWebsite(request.getWebsite());

        return entity;
    }

    public VenueResponse toResponse(Venue entity) {
        VenueResponse response = new VenueResponse();

        response.setId(entity.getId());
        response.setVenueId(entity.getVenueId() != null ? entity.getVenueId().toString() : null);
        response.setHours(entity.getHours());
        response.setPhone(entity.getPhone());
        response.setWebsite(entity.getWebsite());

        // JTS -> GeoJSON (toGeoJson trả null nếu hình học null hoặc rỗng)
        response.setDisplayPoint(geometryConverter.toGeoJson(entity.getDisplayPoint()));
        response.setGeometry(geometryConverter.toGeoJson(entity.getGeometry()));

        if (entity.getFeature() != null) {
            response.setFeatureId(entity.getFeature().getId());
        }

        response.setVenueCategoryId(entity.getVenueCategory().getId());
        response.setVenueCategoryName(entity.getVenueCategory().getVenueCategoryName());

        response.setAddressId(entity.getAddress().getId());
        response.setAddressName(entity.getAddress().getAddress());

        // restriction_category là tùy chọn trong IMDF, bản cũ sẽ lỗi NullPointerException nếu null
        if (entity.getRestrictionCategory() != null) {
            response.setRestrictionCategoryId(entity.getRestrictionCategory().getId());
            response.setRestrictionCategoryName(entity.getRestrictionCategory().getRestrictionCateName());
        }

        return response;
    }

    /** Chỉ cập nhật thuộc tính thường. Quan hệ và hình học do service xử lý. */
    public void updateScalars(VenueRequest request, Venue venue) {
        venue.setHours(request.getHours());
        venue.setPhone(request.getPhone());
        venue.setWebsite(request.getWebsite());
    }
}