package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.OpeningRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OpeningService {
    Page<OpeningResponse> getAll(Pageable pageable);

    OpeningResponse create(OpeningRequest request);

    OpeningResponse getById(Integer id);

    OpeningResponse update(Integer id, OpeningRequest request);

    void delete(Integer id);
}
