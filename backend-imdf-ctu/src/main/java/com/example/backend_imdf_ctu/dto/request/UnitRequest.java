package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UnitRequest {
    @NotBlank(message = "Unit name is required")
    private String unitName;

    @NotNull(message = "Geometry is required")
    private GeoJsonGeometry geometry;

    @NotNull(message = "Display point is required")
    private GeoJsonGeometry displayPoint;

    @NotNull(message = "Feature ID is required")
    private Integer featureId;

    @NotNull(message = "Level ID is required")
    private Integer levelId;

    @NotNull(message = "Unit category ID is required")
    private Integer unitCategoryId;

    @NotNull(message = "Restriction category ID is required")
    private Integer restrictionCategoryId;
}
