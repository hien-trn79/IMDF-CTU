package com.example.backend_imdf_ctu.dto.geojson;

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
public class GeoJsonFeatureCollection {
    @Builder.Default
    private String type = "FeatureCollection";
    private List<GeoJsonFeature> features;

    // Thêm metadata phân trang vào chuẩn response GeoJSON
    private Map<String, Object> pagination;
}
