package com.example.backend_imdf_ctu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnchorRequest {
    @NotBlank(message = "Anchor name cannot be blank")
    private String anchorName;

    @NotNull(message = "Geometry cannot be null")
    private GeoJsonGeometry geometry;

    @NotNull(message = "Feature ID cannot be null")
    private Integer featureId;

    @NotNull(message = "Unit ID cannot be null")
    private Integer unitId;
}
