package com.example.backend_imdf_ctu.dto.response;

import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuildingResponse {
    private Integer id;

    private UUID buildingId;

    private GeoJsonGeometry displayPoint; // WKT representation of Point

    private GeoJsonGeometry geometry; // WKT representation of MultiPolygon

    private Integer featureId;

    private Integer addressId;

    private Integer restrictionCategoryId;

    private Integer buildingCategoryId;
}
