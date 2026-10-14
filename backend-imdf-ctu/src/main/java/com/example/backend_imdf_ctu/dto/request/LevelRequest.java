package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LevelRequest {

    private GeoJsonGeometry geometry;

    private Boolean outdoor;

    private Integer ordinal;

    private GeoJsonGeometry displayPoint;

    @NotNull(message = "Level category ID cannot be null")
    private Integer levelCategoryId;
}
