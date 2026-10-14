package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.BuildingRequest;
import com.example.backend_imdf_ctu.dto.response.BuildingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BuildingService {
    BuildingResponse create(BuildingRequest request);

    BuildingResponse getById(Integer id);

    Page<BuildingResponse> list(Pageable pageable);

    BuildingResponse update(Integer id, BuildingRequest request);

    void delete(Integer id);
}
