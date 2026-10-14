package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.SectionCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.SectionCategoryResponse;

import java.util.List;

public interface SectionCategoryService {
    List<SectionCategoryResponse> getAll();

    SectionCategoryResponse create(SectionCategoryRequest request);
}
