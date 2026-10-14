package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.SectionRequest;
import com.example.backend_imdf_ctu.dto.response.SectionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SectionService {
    Page<SectionResponse> getAll(Pageable pageable);

    SectionResponse create(SectionRequest request);

    SectionResponse getById(Integer id);

    SectionResponse update(Integer id, SectionRequest request);

    void delete(Integer id);
}
