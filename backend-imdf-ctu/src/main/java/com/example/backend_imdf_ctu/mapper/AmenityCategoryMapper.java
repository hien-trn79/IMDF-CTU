package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.AmenityCateRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityCateResponse;
import com.example.backend_imdf_ctu.entity.AmenityCategory;
import org.springframework.stereotype.Component;

@Component
public class AmenityCategoryMapper {

    public AmenityCateResponse toResponse(AmenityCategory entity) {
        return new AmenityCateResponse(
                entity.getId(),
                entity.getAmenityCategoryName()
        );
    }

    public AmenityCategory toEntity(AmenityCateRequest request) {
        AmenityCategory entity = new AmenityCategory();
        entity.setAmenityCategoryName(request.getAmenityCateName());
        return entity;
    }
}
