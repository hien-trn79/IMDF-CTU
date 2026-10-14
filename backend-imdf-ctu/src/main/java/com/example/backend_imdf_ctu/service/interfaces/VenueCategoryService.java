package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.VenueCategoryRequest;
import com.example.backend_imdf_ctu.dto.response.VenueCategoryResponse;

import java.util.List;

public interface VenueCategoryService {
    VenueCategoryResponse create(VenueCategoryRequest request);

    List<VenueCategoryResponse> getAll();
}
