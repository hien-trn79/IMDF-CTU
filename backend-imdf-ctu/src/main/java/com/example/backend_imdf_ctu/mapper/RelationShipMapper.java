package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.RelationShipRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipResponse;
import com.example.backend_imdf_ctu.entity.Feature;
import com.example.backend_imdf_ctu.entity.RelationShip;
import com.example.backend_imdf_ctu.entity.RelationShipCategory;
import org.springframework.stereotype.Component;

@Component
public class RelationShipMapper {
    public RelationShip toEntity(
        RelationShipRequest request,
        Feature feature,
        RelationShipCategory relationShipCategory
    ) {
        RelationShip entity = new RelationShip();

        entity.setDirectionEnum(request.getDirection());
        entity.setHours(request.getHours());

        entity.setFeature(feature);
        entity.setRelationShipCategory(relationShipCategory);

        return entity;
    }

    public RelationShipResponse toResponse(RelationShip entity) {
        RelationShipResponse response = new RelationShipResponse();

        response.setId(entity.getId());
        response.setRelationShipId(entity.getRelationshipId());
        response.setDirection(entity.getDirectionEnum().name());
        response.setHours(entity.getHours());

        if (entity.getFeature() != null) {
            response.setFeatureId(entity.getFeature().getId());
            response.setFeatureType(entity.getFeature().getFeatureType());
        }

        if (entity.getRelationShipCategory() != null) {
            response.setRelationShipCategoryId(entity.getRelationShipCategory().getId());
            response.setRelationShipCategoryName(entity.getRelationShipCategory().getRelationshipCategoryName());
        }

        return response;
    }

    public void update(RelationShip entity, RelationShipRequest request, Feature feature, RelationShipCategory relationShipCategory) {
        entity.setDirectionEnum(request.getDirection());
        entity.setHours(request.getHours());

        entity.setFeature(feature);
        entity.setRelationShipCategory(relationShipCategory);
    }
}
