package com.example.backend_imdf_ctu.service;

import com.example.backend_imdf_ctu.dto.request.GridLineRequest;
import com.example.backend_imdf_ctu.dto.request.NetworkEdgesRequest;
import com.example.backend_imdf_ctu.dto.response.GridLineResponse;
import com.example.backend_imdf_ctu.dto.response.NetworkEdgesResponse;

import java.util.List;

public interface GridLineService {

    List<GridLineResponse> getAll();

    GridLineResponse getById(Integer gridLineId);

    GridLineResponse create(GridLineRequest request);

    GridLineResponse update(Integer gridLineId, GridLineRequest request);

    Boolean delete(Integer gridLineId);
}
