package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.UnitCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.UnitCategoryResponse;
import com.example.backend_imdf_ctu.entity.UnitCategory;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@Component
public class UnitCategoryMapper {
    public UnitCategoryResponse toResponse(UnitCategory entity) {
        return new UnitCategoryResponse(
            entity.getId(),
            entity.getUnitCategoryName(),
            entity.getUnitCategoryVietnameseName()
        );
    }

    public UnitCategory toEntity(UnitCategoryRequest request) {
        UnitCategory entity = new UnitCategory();
        entity.setUnitCategoryName(request.getUnitCategoryName());
        entity.setUnitCategoryVietnameseName(request.getUnitCategoryVietnameseName());
        return entity;
    }
}
