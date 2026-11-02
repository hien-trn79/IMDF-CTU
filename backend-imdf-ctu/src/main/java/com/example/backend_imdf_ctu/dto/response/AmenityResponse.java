package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Geometry;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AmenityResponse {
    private Integer id;
    private String amenityId; // UUID as String
    private GeoJsonGeometry geometry; // WKT format for Point
    private String phone;
    private String website;
    private LocalDateTime hours;
    private String correlationId; // UUID as String

    private Integer amenityCategoryId;
    private String amenityCategoryName;

    private Integer featureId;
    private String featureType;

    private Integer unitId;
    private String unitName;
}
