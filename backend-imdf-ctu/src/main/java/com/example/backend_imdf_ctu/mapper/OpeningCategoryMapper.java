package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.OpeningCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningCategoryResponse;
import com.example.backend_imdf_ctu.entity.OpeningCategory;
import org.springframework.stereotype.Component;

@Component
public class OpeningCategoryMapper {
    public OpeningCategoryResponse toResponse(OpeningCategory entity) {
         return new OpeningCategoryResponse(
             entity.getId(),
                entity.getOpeningCategoryName(),
                entity.getOpeningCategoryVietnameseName()
         );
    }

    public OpeningCategory toEntity(OpeningCategoryRequest request) {
        OpeningCategory entity = new OpeningCategory();
        entity.setOpeningCategoryName(request.getOpeningCategoryName());
        entity.setOpeningCategoryVietnameseName(request.getOpeningCategoryVietnameseName());
        return entity;
    }

}
