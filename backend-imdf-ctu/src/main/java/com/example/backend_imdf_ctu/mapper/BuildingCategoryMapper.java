package com.example.backend_imdf_ctu.mapper;

import com.example.backend_imdf_ctu.dto.request.BuildingCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingCategoryResponse;
import com.example.backend_imdf_ctu.entity.BuildingCategory;
import org.springframework.stereotype.Component;

@Component
public class BuildingCategoryMapper {
    public BuildingCategory toEntity(BuildingCategoryRequest request) {
        BuildingCategory buildingCategory = new BuildingCategory();
        buildingCategory.setBuildingCategoryName(request.getBuildingCategoryName());
        buildingCategory.setBuildingCategoryVietnameseName(request.getBuildingCategoryVietnameseName());
        return buildingCategory;
    }

    public BuildingCategoryResponse toResponse(BuildingCategory buildingCategory) {
        return new BuildingCategoryResponse(
            buildingCategory.getId(),
            buildingCategory.getBuildingCategoryName(),
            buildingCategory.getBuildingCategoryVietnameseName()
        );
    }
}
