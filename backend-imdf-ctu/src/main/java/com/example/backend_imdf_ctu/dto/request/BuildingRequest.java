package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BuildingRequest {
    private String buildingName;

    private GeoJsonGeometry displayPoint; // WKT representation of Point

    private GeoJsonGeometry geometry; // WKT representation of MultiPolygon

    @NotNull(message = "Feature ID cannot be null")
    private Integer featureId;

    private Integer addressId;

    @NotNull(message = "Restriction Category ID cannot be null")
    private Integer restrictionCategoryId;

    @NotNull(message = "Building Category ID cannot be null")
    private Integer buildingCategoryId;

    private Integer venueId;
}
