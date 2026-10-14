package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.VenueCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.VenueCategoryResponse;
import com.example.backend_imdf_ctu.entity.VenueCategory;
import org.springframework.stereotype.Component;

@Component
public class VenueCategoryMapper {
    public VenueCategoryResponse toResponse(VenueCategory entity) {
        return new VenueCategoryResponse(
            entity.getId(),
            entity.getVenueCategoryName()
        );
    }

    public VenueCategory toEntity(VenueCategoryRequest request) {
        VenueCategory entity = new VenueCategory();

        entity.setVenueCategoryName(request.getVenueCategoryName());

        return entity;
    }
}
