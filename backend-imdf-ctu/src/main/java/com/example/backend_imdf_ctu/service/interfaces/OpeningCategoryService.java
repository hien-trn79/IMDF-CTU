package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.OpeningCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningCategoryResponse;

import java.util.List;

public interface OpeningCategoryService {
    List<OpeningCategoryResponse> getAll();

    OpeningCategoryResponse create(OpeningCategoryRequest request);
}
