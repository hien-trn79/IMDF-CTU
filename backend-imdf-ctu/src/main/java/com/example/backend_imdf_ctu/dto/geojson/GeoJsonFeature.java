package com.example.backend_imdf_ctu.dto.geojson;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonFeature {
    @Builder.Default
    private String type = "Feature";
    private Object id;
    private GeoJsonGeometry geometry;
    private Map<String, Object> properties;
}
