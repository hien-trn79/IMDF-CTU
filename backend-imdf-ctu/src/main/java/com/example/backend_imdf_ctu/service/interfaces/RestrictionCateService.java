package com.example.backend_imdf_ctu.service.interfaces;


import com.example.backend_imdf_ctu.dto.request.RestrictionCateRequest;
import com.example.backend_imdf_ctu.dto.response.RestrictionCateResponse;

import java.util.List;

public interface RestrictionCateService {
    RestrictionCateResponse create(RestrictionCateRequest request);

    RestrictionCateResponse getById(Integer id);
}
