package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.response.RelationShipCateResponse;
import com.example.backend_imdf_ctu.entity.RelationShipCategory;
import org.springframework.stereotype.Component;

@Component
public class RelationShipCateMapper {
    public RelationShipCateResponse toResponse(RelationShipCategory entity) {
        return new RelationShipCateResponse(
            entity.getId(),
            entity.getRelationshipCategoryName()
        );
    }

    public RelationShipCategory toEntity(RelationShipCateResponse response) {
        RelationShipCategory entity = new RelationShipCategory();
        entity.setId(response.getId());
        entity.setRelationshipCategoryName(response.getRelationshipCategoryName());
        return entity;
    }
}
