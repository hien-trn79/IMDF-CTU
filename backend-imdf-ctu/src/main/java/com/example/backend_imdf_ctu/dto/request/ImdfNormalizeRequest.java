package com.example.backend_imdf_ctu.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImdfNormalizeRequest {
    private String featureType;
    private GeoJsonGeometry geometry;
    private GeoJsonGeometry displayPoint;
    private Map<String, Object> properties;
    private Double simplifyTolerance;
}
