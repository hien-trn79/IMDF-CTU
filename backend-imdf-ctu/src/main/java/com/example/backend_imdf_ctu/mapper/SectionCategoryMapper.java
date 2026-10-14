package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.SectionCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.SectionCategoryResponse;
import com.example.backend_imdf_ctu.entity.SectionCategory;
import org.springframework.stereotype.Component;

@Component
public class SectionCategoryMapper {

    public SectionCategoryResponse toResponse(SectionCategory entity) {
        return new SectionCategoryResponse(
                entity.getId(),
                entity.getSectionCategoryName()
        );
    }

    public SectionCategory toEntity(SectionCategoryRequest request) {
        SectionCategory entity = new SectionCategory();
        entity.setSectionCategoryName(request.getSectionCategoryName());
        return entity;
    }
}
