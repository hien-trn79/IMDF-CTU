package com.example.backend_imdf_ctu.service;

import com.example.backend_imdf_ctu.dto.request.IndoorRouteRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorRouteResponse;

import java.util.List;

public interface IndoorRouteService {

    List<IndoorRouteResponse> getAll();

    IndoorRouteResponse getById(Integer indoorRouteId);

    IndoorRouteResponse create(IndoorRouteRequest request);

    IndoorRouteResponse update(Integer indoorRouteId, IndoorRouteRequest request);

    void delete(Integer indoorRouteId);
}
