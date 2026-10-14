package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.LevelCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.LevelCategoryResponse;

import java.util.List;

public interface LevelCategoryService {
    List<LevelCategoryResponse> getAll();

    LevelCategoryResponse create(LevelCategoryRequest request);
}
