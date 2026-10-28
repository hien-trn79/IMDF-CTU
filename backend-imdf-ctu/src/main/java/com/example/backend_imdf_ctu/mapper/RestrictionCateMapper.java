package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.RestrictionCateRequest;
import com.example.backend_imdf_ctu.dto.response.RestrictionCateResponse;
import com.example.backend_imdf_ctu.entity.RestrictionCategory;
import org.springframework.stereotype.Component;

@Component
public class RestrictionCateMapper {

    public RestrictionCateResponse toResponse(RestrictionCategory restrictionCategory) {

        return new RestrictionCateResponse(
                restrictionCategory.getId(),
                restrictionCategory.getRestrictionCateName(),
                restrictionCategory.getRestrictionCateVietnameseName()
        );
    }

    public RestrictionCategory toEntity(RestrictionCateRequest request) {
        RestrictionCategory entity = new RestrictionCategory();

        entity.setRestrictionCateName(request.getRestrictionCateName());
        entity.setRestrictionCateVietnameseName(request.getRestrictionCateVietnameseName());

        return entity;
    }
}
