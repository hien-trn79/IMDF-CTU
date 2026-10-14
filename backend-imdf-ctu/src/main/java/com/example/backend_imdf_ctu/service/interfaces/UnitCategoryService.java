package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UnitCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.UnitCategoryResponse;

import java.util.List;

public interface UnitCategoryService {
    List<UnitCategoryResponse> getAll();

    UnitCategoryResponse getById(Integer id);

    UnitCategoryResponse create(UnitCategoryRequest request);
}
