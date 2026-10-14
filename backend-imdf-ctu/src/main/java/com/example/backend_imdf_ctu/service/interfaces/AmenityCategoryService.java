package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AmenityCateRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityCateResponse;

import java.util.List;

public interface AmenityCategoryService {
    AmenityCateResponse create(AmenityCateRequest request);

    List<AmenityCateResponse> getAll();
}
