package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.RelationShipCateRequest;
import com.example.backend_imdf_ctu.dto.response.RelationShipCateResponse;
import com.example.backend_imdf_ctu.entity.RelationShipCategory;
import org.springframework.stereotype.Component;

@Component
public class RelationShipCateMapper {
    public RelationShipCateResponse toResponse(RelationShipCategory entity) {
        return new RelationShipCateResponse(
            entity.getId(),
            entity.getRelationshipCategoryName(),
            entity.getRelationshipCategoryVietnameseName()
        );
    }

    public RelationShipCategory toEntity(RelationShipCateRequest request) {
        RelationShipCategory entity = new RelationShipCategory();

        entity.setRelationshipCategoryName(request.getRelationshipCategoryName());
        entity.setRelationshipCategoryVietnameseName(request.getRelationshipCategoryVietnameseName());

        return entity;
    }
}
