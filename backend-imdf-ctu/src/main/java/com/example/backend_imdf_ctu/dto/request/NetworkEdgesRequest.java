package com.example.backend_imdf_ctu.dto.request;

import lombok.Data;

@Data
public class NetworkEdgesRequest {

    private Integer source;

    private Integer target;

    private Double cost;

    private Double reverseCost;

    private GeoJsonGeometry geometry; // Assuming geometry is represented as a WKT string

    private Integer indoorRouteId;
}
