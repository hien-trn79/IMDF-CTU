package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.request.LevelRequest;
import com.example.backend_imdf_ctu.dto.response.LevelResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LevelService {
    LevelResponse create(LevelRequest request);

    LevelResponse getById(Integer id);

    Page<LevelResponse> list(Pageable pageable);

    LevelResponse update(Integer id, LevelRequest request);

    void delete(Integer id);
}
