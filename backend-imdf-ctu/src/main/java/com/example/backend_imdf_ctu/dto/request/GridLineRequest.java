package com.example.backend_imdf_ctu.dto.request;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.locationtech.jts.geom.LineString;

import java.util.UUID;

@Data
public class GridLineRequest {

    private String category;

    private Boolean isOneWay;

    @NotNull(message = "geom cannot be null")
    private String geom;

    @NotNull(message = "indoorRouteId cannot be null")
    private Integer indoorRouteId;
}
