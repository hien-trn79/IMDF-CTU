package com.example.backend_imdf_ctu.service.interfaces;

import com.example.backend_imdf_ctu.dto.geojson.GeoJsonFeatureCollection;
import com.example.backend_imdf_ctu.dto.request.IndoorShortestPathRequest;
import com.example.backend_imdf_ctu.dto.response.IndoorShortestPathResponse;

public interface IndoorRoutingService {
    GeoJsonFeatureCollection getShortestPath(IndoorShortestPathRequest request);
}
