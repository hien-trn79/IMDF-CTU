package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OpeningRequest {
    @NotBlank(message = "Opening name cannot be blank")
    private String openingName;

    @NotNull(message = "Geometry cannot be null")
    private GeoJsonGeometry geometry;

    private GeoJsonGeometry displayPoint;

    @NotNull(message = "Feature ID cannot be null")
    private Integer unitId;

    @NotNull(message = "Opening category ID cannot be null")
    private Integer openingCategoryId;
}
