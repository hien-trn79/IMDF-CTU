package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.LevelCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.LevelCategoryResponse;
import com.example.backend_imdf_ctu.entity.LevelCategory;
import org.springframework.stereotype.Component;

@Component
public class LevelCategoryMapper {
    public LevelCategoryResponse toResponse(LevelCategory entity) {
        return new LevelCategoryResponse(
            entity.getId(),
            entity.getLevelCategoryName(),
            entity.getLevelCategoryVietnameseName()
        );
    }

    public LevelCategory toEntity(LevelCategoryRequest request) {
        LevelCategory entity = new LevelCategory();
        entity.setLevelCategoryName(request.getLevelCategoryName());
        entity.setLevelCategoryVietnameseName(request.getLevelCategoryVietnameseName());
        return entity;
    }
}
