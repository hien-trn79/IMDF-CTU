package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.UnitRequest;
import com.example.backend_imdf_ctu.dto.response.UnitResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UnitService {
    Page<UnitResponse> getAll(Pageable pageable);

    List<UnitResponse> getAllByLevelId(Integer levelId);

    UnitResponse getById(Integer id);

    UnitResponse create(UnitRequest request);

    UnitResponse update(Integer id, UnitRequest request);

    void delete(Integer id);
}
