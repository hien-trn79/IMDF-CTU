package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AmenityRequest;
import com.example.backend_imdf_ctu.dto.response.AmenityResponse;

import java.util.List;

public interface AmenityService {
    List<AmenityResponse> getAll();

    AmenityResponse create(AmenityRequest request);
}
