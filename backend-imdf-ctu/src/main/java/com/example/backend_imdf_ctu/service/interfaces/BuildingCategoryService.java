package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.BuildingCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingCategoryResponse;

import java.util.List;

public interface BuildingCategoryService {
    List<BuildingCategoryResponse> getAll();

    BuildingCategoryResponse create(BuildingCategoryRequest request);
}
