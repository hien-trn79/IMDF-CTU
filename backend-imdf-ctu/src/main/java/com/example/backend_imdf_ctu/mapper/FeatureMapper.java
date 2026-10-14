package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.FeatureRequest;
import com.example.backend_imdf_ctu.dto.response.FeatureResponse;
import com.example.backend_imdf_ctu.entity.Feature;
import org.springframework.stereotype.Component;

@Component
public class FeatureMapper {

    public FeatureResponse toResponse(Feature entity) {
         return new FeatureResponse(
                 entity.getId(),
                 entity.getFeatureId(),
                 entity.getFeatureType()
         );
    }

    public Feature toEntity(FeatureRequest request) {
        Feature entity = new Feature();
        entity.setFeatureType(request.getFeatureType());
        return entity;
    }
}
