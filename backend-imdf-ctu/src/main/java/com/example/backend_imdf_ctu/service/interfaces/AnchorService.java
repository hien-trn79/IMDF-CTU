package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.AnchorRequest;
import com.example.backend_imdf_ctu.dto.response.AnchorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AnchorService {
    Page<AnchorResponse> getAll(Pageable pageable);

    AnchorResponse getById(Integer id);

    AnchorResponse create(AnchorRequest request);

    AnchorResponse update(Integer id, AnchorRequest request);

    void delete(Integer id);
}
