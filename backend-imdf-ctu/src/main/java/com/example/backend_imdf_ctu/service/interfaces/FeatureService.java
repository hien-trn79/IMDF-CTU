package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.FeatureRequest;
import com.example.backend_imdf_ctu.dto.response.FeatureResponse;

import java.util.List;

public interface FeatureService {
    FeatureResponse create(FeatureRequest request);

    List<FeatureResponse> getAll();
}
