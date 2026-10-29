package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImdfNormalizeResponse {
    private boolean valid;
    private String message;
    private String featureType;
    private GeoJsonGeometry geometry;
    private GeoJsonGeometry displayPoint;
    private Map<String, Object> properties;
    private List<Double> bbox;
    private Double areaSqm;
    private Double lengthMeters;
    private Integer vertexCount;
    private String geometryType;
}
