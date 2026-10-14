package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UnitService {
    Page<UnitResponse> getAll(Pageable pageable);

    UnitResponse getById(Integer id);

    UnitResponse create(UnitRequest request);

    UnitResponse update(Integer id, UnitRequest request);

    void delete(Integer id);
}
