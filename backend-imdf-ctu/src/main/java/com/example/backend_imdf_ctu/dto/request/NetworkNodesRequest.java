package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

@Data
public class NetworkNodesRequest {

    private Boolean isConnector;

    private GeoJsonGeometry geometry;

    private Integer indoorRouteId;
}
