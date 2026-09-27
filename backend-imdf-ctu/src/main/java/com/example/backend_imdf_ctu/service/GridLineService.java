package com.example.backend_imdf_ctu.service;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.dto.response.GridLineResponse;

import java.util.List;
import java.util.UUID;

public interface GridLineService {

    List<GridLineResponse> getAll();

    GridLineResponse getById(Integer gridLineId);

    GridLineResponse create(GridLineRequest request);

    GridLineResponse update(Integer gridLineId, GridLineRequest request);

    Boolean delete(Integer gridLineId);
}
