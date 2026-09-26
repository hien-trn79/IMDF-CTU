package com.example.backend_imdf_ctu.service;

import com.example.backend_imdf_ctu.dto.request.IndoorRouteRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;

import java.util.List;
import java.util.UUID;

public interface IndoorRouteService {

    List<IndoorRouteResponse> getAll();

    IndoorRouteResponse getById(UUID indoorRouteId);

    IndoorRouteResponse create(IndoorRouteRequest request);

    IndoorRouteResponse update(UUID indoorRouteId, IndoorRouteRequest request);

    void delete(UUID indoorRouteId);
}
