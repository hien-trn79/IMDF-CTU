package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.ImdfNormalizeRequest;
import com.example.backend_imdf_ctu.dto.response.ImdfNormalizeResponse;

public interface ImdfSpatialService {
    ImdfNormalizeResponse normalizeAndValidate(ImdfNormalizeRequest request);
}
